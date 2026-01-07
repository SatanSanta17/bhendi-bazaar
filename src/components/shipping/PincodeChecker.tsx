/**
 * Pincode Serviceability Checker Component
 * 
 * Allows users to check if delivery is available to their pincode
 */

"use client";

import { useState, useEffect } from "react";
import { useServiceability } from "@/hooks/useServiceability";
import { CheckCircle2, XCircle, Loader2, MapPin } from "lucide-react";

interface PincodeCheckerProps {
  pincode?: string;
  onServiceabilityChange?: (serviceable: boolean) => void;
  autoCheck?: boolean;
}

export function PincodeChecker({
  pincode: initialPincode = "",
  onServiceabilityChange,
  autoCheck = false,
}: PincodeCheckerProps) {
  const [pincode, setPincode] = useState(initialPincode);
  const { checkServiceability, isChecking, result, error, reset } = useServiceability();

  // Auto-check when pincode changes (if enabled and pincode is valid)
  useEffect(() => {
    if (autoCheck && pincode.length === 6) {
      checkServiceability(pincode);
    }
  }, [pincode, autoCheck, checkServiceability]);

  // Notify parent of serviceability changes
  useEffect(() => {
    if (result && onServiceabilityChange) {
      onServiceabilityChange(result.serviceable);
    }
  }, [result, onServiceabilityChange]);

  // Sync with external pincode changes
  useEffect(() => {
    if (initialPincode !== pincode) {
      setPincode(initialPincode);
      if (initialPincode) {
        reset();
      }
    }
  }, [initialPincode]);

  const handleCheck = () => {
    if (pincode.length === 6) {
      checkServiceability(pincode);
    }
  };

  const handlePincodeChange = (value: string) => {
    // Only allow numbers, max 6 digits
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    setPincode(cleaned);
    
    // Reset results when pincode changes
    if (cleaned !== pincode) {
      reset();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter pincode"
            value={pincode}
            onChange={(e) => handlePincodeChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && pincode.length === 6) {
                handleCheck();
              }
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={6}
          />
        </div>
        
        {!autoCheck && (
          <button
            type="button"
            onClick={handleCheck}
            disabled={pincode.length !== 6 || isChecking}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Check"
            )}
          </button>
        )}
      </div>

      {/* Loading State */}
      {isChecking && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking availability...</span>
        </div>
      )}

      {/* Success State */}
      {result && result.serviceable && (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">
              Delivery Available
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              {result.message || `We deliver to ${pincode}`}
            </p>
            {result.providers.length > 0 && (
              <p className="text-xs text-green-600 mt-1">
                Via: {result.providers.map(p => p.name).join(", ")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error/Not Serviceable State */}
      {(error || (result && !result.serviceable)) && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">
              Delivery Not Available
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              {error || result?.message || `We don't deliver to ${pincode} yet`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

