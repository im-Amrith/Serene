export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export const findGenericDrug = async (brandName: string): Promise<SearchResult[]> => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const cx = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
  
  // We search for "generic equivalent of [Brand Name] price India"
  // Adding "India" ensures we get local pricing (Netmeds, 1mg, etc.)
  const query = `generic equivalent of ${brandName} price India`;
  
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Google returns results in 'items' array
    if (!data.items) return [];

    return data.items.slice(0, 3).map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet
    }));
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
};
