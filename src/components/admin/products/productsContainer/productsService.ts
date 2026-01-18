/**
 * Admin Product Service (Client-side)
 * Handles API calls for product management
 */

export class ProductsService {
  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete product");
    }
  }
}
