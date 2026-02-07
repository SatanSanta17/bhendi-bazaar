// src/hooks/useAddressManager.ts

import { useState, useCallback, useMemo, useEffect } from "react";
import { Address } from "@/domain/profile";
import { addressService } from "@/services/addressService";

type UseAddressManagerOptions = {
    userId?: string;           // For authenticated users
    autoFetch?: boolean;       // Auto-fetch on mount
    onAddressSelect?: (address: Address) => void; // For checkout
}

type UseAddressManagerReturn = {
    // Data
    addresses: Address[];
    selectedAddress: Address | null;
    defaultAddress: Address | null;

    // Loading states
    isLoading: boolean;
    isSaving: boolean;
    isDeleting: boolean;

    // Error states
    error: string | null;

    // Actions
    fetchAddresses: () => Promise<void>;
    addAddress: (address: Address) => Promise<void>;
    updateAddress: (id: string, address: Address) => Promise<void>;
    deleteAddress: (id: string) => Promise<void>;
    selectAddress: (address: Address) => void;

    // Helpers
    resetError: () => void;
    getAddressById: (id: string) => void;
}

export function useAddressManager(options?: UseAddressManagerOptions): UseAddressManagerReturn {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch addresses
    const fetchAddresses = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await addressService.getAddresses();
            setAddresses(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load addresses');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Add address
    const addAddress = async (input: Address) => {
        setIsSaving(true);
        setError(null);

        try {
            const response = await addressService.addAddress(input);
            if (!response) {
                throw new Error('Failed to add address');
            }
            if (input.isDefault) {
                await fetchAddresses();
            }
            else {
                setAddresses(prev => [...prev, input]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add address');
            throw err;
        } finally {
            setIsSaving(false);
        }
    };

    // Update address
    const updateAddress = useCallback(async (id: string, input: Address) => {
        setIsSaving(true);
        setError(null);
        const originalAddresses = addresses;

        try {
            const response = await addressService.updateAddress(id, input);

            if (!response) {
                setAddresses(originalAddresses);
                setError('Failed to update address');
            }
            if (input.isDefault) {
                await fetchAddresses();
            }
            else {
                setAddresses(prev => prev.map(addr => addr.id === id ? input : addr));
            }

        } catch (err) {
            setAddresses(originalAddresses);
            setError(err instanceof Error ? err.message : 'Failed to update address');
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, []);

    // Delete address
    const deleteAddress = useCallback(async (id: string) => {
        setIsDeleting(true);
        setError(null);
        const originalAddresses = addresses;
        const deletingDefault = addresses.find(addr => addr.id === id)?.isDefault;
        setAddresses(prev => prev.filter(addr => addr.id !== id));

        try {
            await addressService.deleteAddress(id);

            // ✅ If deleted address was default, refetch to get new default
            if (deletingDefault) {
                await fetchAddresses();
            }
        } catch (error) {
            setAddresses(originalAddresses);
            setError(error instanceof Error ? error.message : 'Failed to delete address');
            throw error;
        } finally {
            setIsDeleting(false);
        }
    }, [addresses]);

    // Select address (for checkout)
    const selectAddress = useCallback((address: Address) => {
        setSelectedAddress(address);
        options?.onAddressSelect?.(address);
    }, [options]);

    // Computed values
    const defaultAddress = useMemo(
        () => addresses.find(addr => addr.isDefault) ?? addresses[0] ?? null,
        [addresses]
    );

    // Helper
    const getAddressById = useCallback((id: string) => {
        return addresses.find(addr => addr.id === id);
    }, [addresses]);

    const resetError = useCallback(() => {
        setError(null);
    }, []);

    // Auto-fetch on mount
    useEffect(() => {
        if (options?.autoFetch) {
            fetchAddresses();
        }
    }, [options?.autoFetch, fetchAddresses]);

    return {
        addresses,
        selectedAddress,
        defaultAddress,
        isLoading,
        isSaving,
        isDeleting,
        error,
        fetchAddresses,
        addAddress,
        updateAddress,
        deleteAddress,
        selectAddress,
        resetError,
        getAddressById,
    };
}