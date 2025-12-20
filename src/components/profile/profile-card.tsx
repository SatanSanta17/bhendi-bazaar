"use client";

import { useState } from "react";
import { Camera, Edit3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { User } from "@/domain/profile";

interface ProfileCardProps {
  user: User | null;
  profilePic?: string | null;
  loading?: boolean;
  saving?: boolean;
  fallbackName?: string;
  onUpdate: (data: { name?: string; email?: string; mobile?: string }) => Promise<void>;
  onUpdateProfilePic: (profilePic: string) => Promise<void>;
}

export function ProfileCard({
  user,
  profilePic,
  loading,
  saving,
  fallbackName = "",
  onUpdate,
  onUpdateProfilePic,
}: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPic, setIsEditingPic] = useState(false);
  const [picUrl, setPicUrl] = useState(profilePic ?? "");
  const [formData, setFormData] = useState({
    name: user?.name ?? fallbackName,
    email: user?.email ?? "",
    mobile: user?.mobile ?? "",
  });

  const name = user?.name ?? fallbackName;
  const email = user?.email ?? null;
  const mobile = user?.mobile ?? null;
  const initial = name?.charAt(0)?.toUpperCase() ?? "B";

  function handleEdit() {
    setFormData({
      name: user?.name ?? fallbackName,
      email: user?.email ?? "",
      mobile: user?.mobile ?? "",
    });
    setIsEditing(true);
  }

  async function handleSave() {
    await onUpdate({
      name: formData.name || undefined,
      email: formData.email || undefined,
      mobile: formData.mobile || undefined,
    });
    setIsEditing(false);
  }

  function handleCancel() {
    setIsEditing(false);
  }

  function handleEditPic() {
    setPicUrl(profilePic ?? "");
    setIsEditingPic(true);
  }

  async function handleSavePic() {
    if (picUrl.trim()) {
      await onUpdateProfilePic(picUrl.trim());
    }
    setIsEditingPic(false);
  }

  function handleCancelPic() {
    setIsEditingPic(false);
    setPicUrl("");
  }

  return (
    <Card>
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Account</CardTitle>
          {!isEditing && !isEditingPic && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEdit}
              disabled={loading}
              className="rounded-full text-[0.7rem] font-semibold uppercase tracking-[0.2em]"
            >
              <Edit3 className="mr-1 h-3 w-3" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
      {!isEditing && !isEditingPic ? (
          <div className="flex items-center gap-4">
            {/* Profile Picture with Edit Button */}
            <div className="relative">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt={name || "Profile"}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-semibold">
                  {initial}
                </div>
              )}
              {!isEditingPic && (
                <button
                  type="button"
                  onClick={handleEditPic}
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  title="Change profile picture"
                >
                  <Camera className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">
                {loading && !name ? "Loading…" : name || "Your name"}
              </p>
              {email && <p className="text-xs text-muted-foreground">{email}</p>}
              {mobile && (
                <p className="text-xs text-muted-foreground">+91 {mobile}</p>
              )}
            </div>
          </div>
        ) : isEditingPic ? (
          // Profile Picture Edit Form
          <div className="space-y-3 text-xs">
            <div className="flex flex-col items-center gap-3">
              {picUrl ? (
                <img
                  src={picUrl}
                  alt="Preview"
                  className="h-20 w-20 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-semibold">
                  {initial}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Profile Picture URL
              </label>
              <Input
                type="url"
                value={picUrl}
                onChange={(e) => setPicUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
              />
              <p className="text-[0.65rem] text-muted-foreground">
                Enter a URL to an image (JPEG, PNG, etc.)
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={handleCancelPic}
                className="rounded-full text-[0.7rem] font-semibold uppercase tracking-[0.2em]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving || !picUrl.trim()}
                onClick={handleSavePic}
                className="rounded-full text-[0.7rem] font-semibold uppercase tracking-[0.2em]"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ) :
        (
          <form className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Mobile Number
              </label>
              <Input
                type="tel"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, mobile: e.target.value }))
                }
                placeholder="10-digit mobile number"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={handleCancel}
                className="rounded-full text-[0.7rem] font-semibold uppercase tracking-[0.2em]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={handleSave}
                className="rounded-full text-[0.7rem] font-semibold uppercase tracking-[0.2em]"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}