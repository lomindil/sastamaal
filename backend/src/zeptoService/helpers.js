const parseResponse = (response) => {
    try {
        if (!response) {
            console.warn("❌ Empty Zepto response");
            return [];
        }

        const layouts = response?.layout || [];
        const products = [];

        for (const widget of layouts) {
            if (widget?.widgetId !== "PRODUCT_GRID") continue;
            const items = widget?.data?.resolver?.data?.items || [];
            for (const item of items) {
                const pr = item?.productResponse;
                if (!pr) continue;

                const product = pr.product || {};
                const variant = pr.productVariant || {};

                products.push({
                    name: product.name || null,
                    Image: variant.images?.[0]?.path ?
                        `https://cdn.zeptonow.com/${variant.images[0].path}` : null,
                    quantity: variant.formattedPacksize || null,
                    brand: product.brand || null,
                    id: pr.id,
                    storeId: pr.storeId,
                    weightInGms: variant.weightInGms || null,
                    price: pr.mrp ? pr.mrp / 100 : null,
                    offerPrice: pr.sellingPrice
                        ? pr.sellingPrice / 100
                        : null,
                    discountedOfferPrice: pr.discountedSellingPrice
                        ? pr.discountedSellingPrice / 100
                        : null,
                    Discount: pr.discountPercent || 0,
                    product_state: !pr.outOfStock,
                    availableQuantity: pr.availableQuantity || 0,
                });
            }
        }
        return products;

    } catch (err) {
        console.error("Error parsing Zepto response:", err);
        return [];
    }
};

module.exports = {
    parseResponse,
};