const parseResponse = (response) => {
    try {
      if (!response) {
        console.warn("Empty response");
        return [];
      }
  
      if (response.is_success === false) {
        console.warn("Blinkit response unsuccessful");
        return [];
      }
  
      const snippets =
        response?.response?.snippets || [];
  
      const products = [];
      for (const item of snippets) {
        const data = item?.data;
        if (!data || !data.name?.text) continue;
  
        products.push({
          image: data.image?.url ?? null,
          name: data.name.text,
          price: data.mrp?.text ?? null,
          offerPrice:
            data.normal_price?.text ??
            data.mrp?.text ??
            null,
          discount: data.offer_tag?.title?.text ?? null,
          quantity: data.variant?.text ?? null,
          productState: data.product_state ?? "UNKNOWN"
        });
      }
  
      return products;
    } catch (err) {
      console.error("Error parsing Blinkit response:", err);
      return [];
    }
};
       

module.exports = {
  parseResponse,
};