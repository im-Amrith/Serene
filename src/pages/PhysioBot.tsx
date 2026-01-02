import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import { Activity, Play, RotateCcw, Trophy, Info, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

// Types for our precision logic
type ExerciseState = 'UP' | 'DOWN' | 'HOLDING';
type Arm = 'left' | 'right';

interface Keypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

const PhysioBot = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State
  const [isRunning, setIsRunning] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [feedback, setFeedback] = useState("Ready to start?");
  const [exerciseState, setExerciseState] = useState<ExerciseState>('DOWN');
  const [isLoading, setIsLoading] = useState(true);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [activeArm, setActiveArm] = useState<Arm>('left');
  const [formScore, setFormScore] = useState(100); // 0-100 score based on stability

  // Refs for smoothing and logic to avoid re-renders
  const prevKeypointsRef = useRef<Map<string, {x: number, y: number}>>(new Map());
  const elbowBasePosRef = useRef<{x: number, y: number} | null>(null);
  const stateRef = useRef<ExerciseState>('DOWN'); // Ref for synchronous updates in loop

  // Load MoveNet Model
  useEffect(() => {
    const loadModel = async () => {
      await tf.ready();
      const model = poseDetection.SupportedModels.MoveNet;
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
      };
      const detector = await poseDetection.createDetector(model, detectorConfig);
      setDetector(detector);
      setIsLoading(false);
    };
    loadModel();
  }, []);

  // Weighted Moving Average for smoothing jitter
  const smoothKeypoint = (name: string, current: Keypoint): Keypoint => {
    const prev = prevKeypointsRef.current.get(name);
    const alpha = 0.7; // Smoothing factor (0.7 = heavy reliance on new data, 0.3 = laggy but smooth)
    
    if (!prev) {
      prevKeypointsRef.current.set(name, { x: current.x, y: current.y });
      return current;
    }

    const smoothedX = prev.x * (1 - alpha) + current.x * alpha;
    const smoothedY = prev.y * (1 - alpha) + current.y * alpha;

    prevKeypointsRef.current.set(name, { x: smoothedX, y: smoothedY });
    return { ...current, x: smoothedX, y: smoothedY };
  };

  // Calculate Angle between three points
  const calculateAngle = (a: Keypoint, b: Keypoint, c: Keypoint) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  // Draw Logic
  const drawCanvas = useCallback((pose: poseDetection.Pose, videoWidth: number, videoHeight: number, canvas: HTMLCanvasElement, angle: number, arm: Arm) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, videoWidth, videoHeight);

    // Highlight Active Arm
    const shoulder = pose.keypoints.find(k => k.name === `${arm}_shoulder`);
    const elbow = pose.keypoints.find(k => k.name === `${arm}_elbow`);
    const wrist = pose.keypoints.find(k => k.name === `${arm}_wrist`);

    if (shoulder && elbow && wrist) {
      // Draw Upper Arm (Shoulder to Elbow) - Tracking Line 1
      ctx.beginPath();
      ctx.moveTo(shoulder.x, shoulder.y);
      ctx.lineTo(elbow.x, elbow.y);
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#f59e0b'; // Amber-500 for Upper Arm
      ctx.lineCap = 'round';
      ctx.stroke();

      // Draw Forearm (Elbow to Wrist) - Tracking Line 2
      ctx.beginPath();
      ctx.moveTo(elbow.x, elbow.y);
      ctx.lineTo(wrist.x, wrist.y);
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#3b82f6'; // Blue-500 for Forearm
      ctx.lineCap = 'round';
      ctx.stroke();

      // Draw Joint Circles
      [shoulder, elbow, wrist].forEach(joint => {
        ctx.beginPath();
        ctx.arc(joint.x, joint.y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw Angle Arc
      ctx.beginPath();
      const radius = 40;
      // Calculate start and end angles for the arc
      const startAngle = Math.atan2(shoulder.y - elbow.y, shoulder.x - elbow.x);
      const endAngle = Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x);
      
      ctx.arc(elbow.x, elbow.y, radius, startAngle, endAngle, false); // Draw the actual angle
      ctx.strokeStyle = angle < 65 ? '#22c55e' : (angle > 140 ? '#ef4444' : '#eab308'); 
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw Angle Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`${Math.round(angle)}°`, elbow.x + 50, elbow.y);
    }
  }, []);

  // Core Logic
  const processExercise = useCallback((pose: poseDetection.Pose) => {
    const keypoints = pose.keypoints;
    
    // Auto-detect arm based on visibility score
    const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
    const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
    
    let currentArm: Arm = activeArm;
    if (leftShoulder?.score && rightShoulder?.score) {
      if (leftShoulder.score > rightShoulder.score + 0.1) currentArm = 'left';
      if (rightShoulder.score > leftShoulder.score + 0.1) currentArm = 'right';
    }
    if (currentArm !== activeArm) setActiveArm(currentArm);

    // Get raw keypoints
    const shoulderRaw = keypoints.find(k => k.name === `${currentArm}_shoulder`);
    const elbowRaw = keypoints.find(k => k.name === `${currentArm}_elbow`);
    const wristRaw = keypoints.find(k => k.name === `${currentArm}_wrist`);

    if (!shoulderRaw || !elbowRaw || !wristRaw || 
        (shoulderRaw.score || 0) < 0.3 || 
        (elbowRaw.score || 0) < 0.3 || 
        (wristRaw.score || 0) < 0.3) {
      setFeedback("Position yourself in frame...");
      return;
    }

    // Smooth keypoints
    const shoulder = smoothKeypoint(`${currentArm}_shoulder`, shoulderRaw);
    const elbow = smoothKeypoint(`${currentArm}_elbow`, elbowRaw);
    const wrist = smoothKeypoint(`${currentArm}_wrist`, wristRaw);

    // 1. Calculate Angle
    const angle = calculateAngle(shoulder, elbow, wrist);

    // 2. Check Elbow Stability (Form Correction)
    // Initialize base position if starting a rep
    if (stateRef.current === 'DOWN' && angle > 140) {
      elbowBasePosRef.current = { x: elbow.x, y: elbow.y };
    }

    // Check drift if we have a base
    if (elbowBasePosRef.current) {
      const drift = Math.sqrt(
        Math.pow(elbow.x - elbowBasePosRef.current.x, 2) + 
        Math.pow(elbow.y - elbowBasePosRef.current.y, 2)
      );
      
      // If drift is too high (e.g., > 40 pixels), warn user
      if (drift > 50) {
        setFeedback("Keep your elbow still!");
        setFormScore(prev => Math.max(0, prev - 1)); // Decrease score
      } else {
        setFormScore(prev => Math.min(100, prev + 0.5)); // Recover score
      }
    }

    // 3. State Machine for Rep Counting
    // DOWN: Arm Extended (> 140 deg)
    // UP: Arm Curled (< 65 deg)
    
    if (stateRef.current === 'DOWN') {
      if (angle < 65) {
        stateRef.current = 'UP';
        setExerciseState('UP');
        setRepCount(prev => prev + 1);
        setFeedback("Great! Squeeze at the top.");
        // Trigger haptic or sound here if possible
      } else if (angle < 100) {
        setFeedback("Keep curling...");
      } else {
        setFeedback("Start curling up");
      }
    } else if (stateRef.current === 'UP') {
      if (angle > 140) {
        stateRef.current = 'DOWN';
        setExerciseState('DOWN');
        setFeedback("Fully extended. Good.");
      } else if (angle > 90) {
        setFeedback("Lower slowly...");
      }
    }

    // Draw visual feedback
    if (canvasRef.current && webcamRef.current?.video) {
      drawCanvas(pose, webcamRef.current.video.videoWidth, webcamRef.current.video.videoHeight, canvasRef.current, angle, currentArm);
    }

  }, [activeArm, drawCanvas]);

  // Detection Loop
  useEffect(() => {
    let animationFrameId: number;

    const runDetection = async () => {
      if (isRunning && detector && webcamRef.current && webcamRef.current.video?.readyState === 4) {
        const video = webcamRef.current.video;
        const poses = await detector.estimatePoses(video);
        
        if (poses.length > 0) {
          processExercise(poses[0]);
        }
      }
      if (isRunning) {
        animationFrameId = requestAnimationFrame(runDetection);
      }
    };

    if (isRunning) {
      runDetection();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRunning, detector, processExercise]);

  return (
    <div className="space-y-6 p-6 bg-blue-50/30 rounded-3xl min-h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Physio-Bot Pro</h2>
          <p className="text-slate-500">Precision Motion Analysis</p>
        </div>
        <div className="flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-xl border border-white/50 shadow-sm">
          <Activity className="w-5 h-5 text-blue-600" />
          <span className="text-slate-700 font-medium">Bicep Curls ({activeArm === 'left' ? 'Left' : 'Right'} Arm)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <div className="lg:col-span-2 bg-black rounded-3xl overflow-hidden relative shadow-lg border-4 border-white/20 aspect-video group">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-white z-20 bg-black">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p>Loading Precision Models...</p>
              </div>
            </div>
          )}
          
          <Webcam
            ref={webcamRef}
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            mirrored={true}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover z-10"
          />
          
          {!isRunning && !isLoading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
              <button 
                onClick={() => setIsRunning(true)}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg flex items-center space-x-3 transition-all transform hover:scale-105 shadow-xl shadow-blue-600/30"
              >
                <Play className="w-6 h-6" />
                <span>Start Session</span>
              </button>
            </div>
          )}

          {/* Live Feedback Overlay */}
          {isRunning && (
            <div className="absolute bottom-6 left-6 right-6 z-20">
              <div className={`backdrop-blur-md text-white p-4 rounded-2xl border border-white/10 flex items-center space-x-3 transition-colors duration-300 ${
                feedback.includes("Great") ? "bg-green-500/40" : 
                feedback.includes("still") ? "bg-red-500/40" : "bg-black/50"
              }`}>
                <Info className="w-5 h-5 text-white/80" />
                <p className="font-medium text-lg">{feedback}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats Panel */}
        <div className="space-y-6">
          {/* Rep Counter */}
          <div className="bg-white/40 backdrop-blur-xl p-8 rounded-3xl border border-white/50 shadow-sm flex flex-col items-center justify-center text-center h-64 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-200">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${formScore}%` }}
              />
            </div>
            
            <h3 className="text-slate-500 font-medium uppercase tracking-wider mb-2">Repetitions</h3>
            <div className="text-9xl font-black text-slate-800 tabular-nums leading-none mb-4 tracking-tighter">
              {repCount}
            </div>
            
            <div className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
              formScore > 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {formScore > 80 ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>Form Score: {Math.round(formScore)}%</span>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-800">Session Controls</h3>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                {activeArm === 'left' ? 'Left Arm' : 'Right Arm'}
              </span>
            </div>
            
            <button 
              onClick={() => {
                setRepCount(0);
                setFeedback("Ready to start?");
                setFormScore(100);
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Counter</span>
            </button>
            
            {isRunning && (
              <button 
                onClick={() => setIsRunning(false)}
                className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-colors"
              >
                Stop Session
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-900 text-sm">Pro Tip</h4>
                <p className="text-xs text-blue-800/80 mt-1 leading-relaxed">
                  Keep your elbow locked in space. Only your forearm should move. The AI will deduct points if your elbow drifts!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhysioBot;
