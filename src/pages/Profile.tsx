import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, User, Upload, Twitter, Github, Linkedin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import type { ProfileFormData } from "@/types/profile";

interface DatabaseProfile {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  username: string | null;
  website: string | null;
  avatar_url: string | null;
  bio?: string | null;
  location?: string | null;
  social_links?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  } | null;
}

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  website: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  social_links: z.object({
    twitter: z.string().url().optional().or(z.literal("")),
    github: z.string().url().optional().or(z.literal("")),
    linkedin: z.string().url().optional().or(z.literal(""))
  }).optional()
});

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: "",
    username: "",
    website: "",
    bio: "",
    location: "",
    social_links: {
      twitter: "",
      github: "",
      linkedin: ""
    }
  });

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      const profileData = data as DatabaseProfile;

      setFormData({
        full_name: profileData.full_name ?? "",
        username: profileData.username ?? "",
        website: profileData.website ?? "",
        bio: profileData.bio ?? "",
        location: profileData.location ?? "",
        social_links: {
          twitter: profileData.social_links?.twitter ?? "",
          github: profileData.social_links?.github ?? "",
          linkedin: profileData.social_links?.linkedin ?? ""
        }
      });
      
      return profileData;
    },
    enabled: !!user?.id,
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user?.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
      
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error uploading avatar.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const validatedData = profileSchema.parse(formData);
      
      const { error } = await supabase
        .from("profiles")
        .update(validatedData)
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => err.message).join(", ");
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: errorMessages,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "There was an error updating your profile.",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-2xl mx-auto">
        <div className="glass-panel p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isEditing) {
                  handleUpdate();
                } else {
                  setIsEditing(true);
                }
              }}
            >
              {isEditing ? (
                "Save Changes"
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="absolute bottom-0 right-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                className="hidden"
                accept="image/*"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Full Name *</label>
              {isEditing ? (
                <Input
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="mt-1">{profile?.full_name || "Not set"}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Username *</label>
              {isEditing ? (
                <Input
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="Choose a username"
                />
              ) : (
                <p className="mt-1">{profile?.username || "Not set"}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Bio</label>
              {isEditing ? (
                <Textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself"
                  className="h-24"
                />
              ) : (
                <p className="mt-1">{(profile as DatabaseProfile)?.bio || "Not set"}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Location</label>
              {isEditing ? (
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Where are you based?"
                />
              ) : (
                <p className="mt-1">{(profile as DatabaseProfile)?.location || "Not set"}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Website</label>
              {isEditing ? (
                <Input
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="Enter your website URL"
                />
              ) : (
                <p className="mt-1">
                  {profile?.website ? (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {profile.website}
                    </a>
                  ) : (
                    "Not set"
                  )}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Social Links</label>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-gray-500" />
                    <Input
                      value={formData.social_links.twitter}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          social_links: {
                            ...formData.social_links,
                            twitter: e.target.value
                          }
                        })
                      }
                      placeholder="Twitter profile URL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-gray-500" />
                    <Input
                      value={formData.social_links.github}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          social_links: {
                            ...formData.social_links,
                            github: e.target.value
                          }
                        })
                      }
                      placeholder="GitHub profile URL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-gray-500" />
                    <Input
                      value={formData.social_links.linkedin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          social_links: {
                            ...formData.social_links,
                            linkedin: e.target.value
                          }
                        })
                      }
                      placeholder="LinkedIn profile URL"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {(profile as DatabaseProfile)?.social_links?.twitter && (
                    <a
                      href={(profile as DatabaseProfile).social_links?.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </a>
                  )}
                  {(profile as DatabaseProfile)?.social_links?.github && (
                    <a
                      href={(profile as DatabaseProfile).social_links?.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                    </a>
                  )}
                  {(profile as DatabaseProfile)?.social_links?.linkedin && (
                    <a
                      href={(profile as DatabaseProfile).social_links?.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
