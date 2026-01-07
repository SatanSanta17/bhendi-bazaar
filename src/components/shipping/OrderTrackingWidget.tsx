/**
 * Order Tracking Widget
 * 
 * Displays shipment tracking information on order page
 */

"use client";

import { useState, useEffect } from "react";
import { shippingService } from "@/services/shippingService";
import { getStatusDisplay } from "@/domain/shipping";
import { Package, ExternalLink, Loader2, MapPin, Clock, CheckCircle2 } from "lucide-react";
import type { TrackingInfo } from "@/domain/shipping";

interface OrderTrackingWidgetProps {
  trackingNumber: string;
  courierName?: string;
  trackingUrl?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function OrderTrackingWidget({
  trackingNumber,
  courierName,
  trackingUrl,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
}: OrderTrackingWidgetProps) {
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async () => {
    try {
      setError(null);
      const data = await shippingService.trackShipment(trackingNumber);
      setTracking(data);
    } catch (err) {
      setError("Failed to load tracking information");
      console.error("Tracking error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTracking();
  }, [trackingNumber]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTracking();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, trackingNumber]);

  if (isLoading) {
    return (
      <div className="border rounded-lg p-6 bg-white">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
          <span className="text-gray-600">Loading tracking information...</span>
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="border rounded-lg p-6 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <Package className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Track Shipment</h3>
        </div>
        <p className="text-sm text-gray-600">
          Tracking Number: <span className="font-mono">{trackingNumber}</span>
        </p>
        {courierName && (
          <p className="text-sm text-gray-600 mt-1">
            Courier: {courierName}
          </p>
        )}
        {trackingUrl && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-3"
          >
            Track on courier website
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(tracking.currentStatus as any);

  return (
    <div className="border rounded-lg p-6 bg-white space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Shipment Tracking</h3>
          </div>
          <p className="text-sm text-gray-600">
            Tracking: <span className="font-mono">{trackingNumber}</span>
          </p>
          <p className="text-sm text-gray-600">
            Courier: {tracking.courierName}
          </p>
        </div>
        
        {trackingUrl && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 px-3 py-1.5 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
          >
            Track Live
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Current Status */}
      <div className={`p-4 rounded-lg border-2 bg-${statusDisplay.color}-50 border-${statusDisplay.color}-200`}>
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full bg-${statusDisplay.color}-600`} />
          <span className={`font-semibold text-${statusDisplay.color}-900`}>
            {statusDisplay.label}
          </span>
        </div>
        <p className={`text-sm text-${statusDisplay.color}-700`}>
          {statusDisplay.description}
        </p>
      </div>

      {/* Estimated Delivery */}
      {tracking.estimatedDelivery && !tracking.deliveredAt && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <Clock className="h-4 w-4" />
          <span>
            Estimated delivery: {new Date(tracking.estimatedDelivery).toLocaleDateString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      )}

      {/* Delivered */}
      {tracking.deliveredAt && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-md">
          <CheckCircle2 className="h-4 w-4" />
          <span>
            Delivered on {new Date(tracking.deliveredAt).toLocaleDateString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}

      {/* Timeline */}
      {tracking.history && tracking.history.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Shipment History</h4>
          <div className="space-y-3">
            {tracking.history.map((event, index) => {
              const isLatest = index === 0;
              return (
                <div key={index} className="flex gap-3">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-2 h-2 rounded-full mt-1.5
                      ${isLatest ? "bg-blue-600 ring-4 ring-blue-100" : "bg-gray-300"}
                    `} />
                    {index < tracking.history.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-1" />
                    )}
                  </div>

                  {/* Event details */}
                  <div className="flex-1 pb-3">
                    <p className={`text-sm ${isLatest ? "font-medium text-gray-900" : "text-gray-700"}`}>
                      {event.description || event.status}
                    </p>
                    {event.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(event.timestamp).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

