// src/components/admin/shipping/ConnectProviderModal.tsx

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ConnectionRequestBody } from "../types";

interface ConnectProviderModalProps {
  providerId: string;
  providerName: string;
  open: boolean;
  onClose: () => void;
  onConnect: (requestBody: ConnectionRequestBody) => Promise<boolean>;
  isConnecting?: boolean;
}

export function ConnectProviderModal({
  providerId,
  providerName,
  open,
  onClose,
  onConnect,
  isConnecting = false,
}: ConnectProviderModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const requestBody: ConnectionRequestBody = {
      type: "email_password",
      email,
      password,
    };

    const success = await onConnect(requestBody);

    if (!success) {
      setError("Failed to connect. Please check your credentials.");
    }
    // If successful, modal will be closed by parent
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect {providerName} Account</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isConnecting}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isConnecting}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isConnecting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}