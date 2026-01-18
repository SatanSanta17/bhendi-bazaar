// src/services/admin/sellerService.ts

import type { SellerWithStats, Seller } from "@/domain/seller";
import type { CreateSellerInput } from "@/lib/validation/schemas/seller.schema";

export class SellerService {
  private baseUrl = "/api/admin/sellers";

  async getSellers(includeStats = false): Promise<SellerWithStats[]> {
    const url = includeStats ? `${this.baseUrl}?includeStats=true` : this.baseUrl;
    const response = await fetch(url);
    
    if (!response.ok) {
      // ⭐ Check if response has content before parsing
      const text = await response.text();
      let error;
      try {
        error = JSON.parse(text);
      } catch {
        throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
      }
      throw new Error(error.error || "Failed to fetch sellers");
    }
    
    return response.json();
  }

  async createSeller(data: CreateSellerInput): Promise<Seller> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      // ⭐ Safe JSON parsing
      const text = await response.text();
      let error;
      try {
        error = JSON.parse(text);
      } catch {
        console.error("Non-JSON error response:", text);
        throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
      }
      
      if (error.details) {
        const errorMessages = error.details
          .map((e: any) => `${e.path.join('.')}: ${e.message}`)
          .join('\n');
        throw new Error(errorMessages || error.error);
      }
      
      throw new Error(error.message || error.error || "Failed to create seller");
    }
    
    return response.json();
  }

  async updateSeller(id: string, data: Partial<CreateSellerInput>): Promise<Seller> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const text = await response.text();
      let error;
      try {
        error = JSON.parse(text);
      } catch {
        throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
      }
      throw new Error(error.error || "Failed to update seller");
    }
    
    return response.json();
  }

  async deleteSeller(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const text = await response.text();
      let error;
      try {
        error = JSON.parse(text);
      } catch {
        throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
      }
      throw new Error(error.error || "Failed to delete seller");
    }
    
    // ⭐ DELETE might return empty body or JSON
    const text = await response.text();
    if (text) {
      try {
        return JSON.parse(text);
      } catch {
        return; // Empty response is OK for DELETE
      }
    }
  }
}

export const sellerService = new SellerService();