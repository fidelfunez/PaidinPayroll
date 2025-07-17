import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Upload, X, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { compressImage, validateImageFile, fileToBase64, formatFileSize } from "@/lib/image-utils";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  bio: z.string().optional(),
  profilePhoto: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  title?: string;
  showCard?: boolean;
}

export function ProfileForm({ title = "Profile Settings", showCard = true }: ProfileFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      bio: user?.bio || "",
      profilePhoto: user?.profilePhoto || undefined,
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await apiRequest("PATCH", "/api/user/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setSelectedPhoto(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating profile",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateImageFile(file, 10); // Allow up to 10MB for compression
    if (validationError) {
      toast({
        title: "Invalid file",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsCompressing(true);
    
    try {
      // Show compression progress
      toast({
        title: "Optimizing image...",
        description: `Original size: ${formatFileSize(file.size)}`,
      });

      // Compress the image
      const compressedFile = await compressImage(file);
      
      // Convert to base64
      const base64 = await fileToBase64(compressedFile);
      
      setSelectedPhoto(base64);
      form.setValue("profilePhoto", base64);
      
      // Show compression results
      const compressionRatio = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
      toast({
        title: "Image optimized!",
        description: `Reduced from ${formatFileSize(file.size)} to ${formatFileSize(compressedFile.size)} (${compressionRatio}% smaller)`,
      });
      
    } catch (error) {
      console.error('Image processing failed:', error);
      toast({
        title: "Image processing failed",
        description: "Please try again with a different image.",
        variant: "destructive",
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    form.setValue("profilePhoto", "");
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Photo Section */}
        <div className="space-y-4">
          <Label>Profile Photo</Label>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
              {selectedPhoto || user?.profilePhoto ? (
                <img
                  src={selectedPhoto || user?.profilePhoto || ""}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-slate-400" />
              )}
            </div>
            
            <div className="flex space-x-2">
              <Label htmlFor="photo-upload" className="cursor-pointer">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  asChild
                  disabled={isCompressing}
                >
                  <span>
                    {isCompressing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                    <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isCompressing ? "Optimizing..." : "Upload"}
                  </span>
                </Button>
              </Label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={isCompressing}
              />
              
              {(selectedPhoto || user?.profilePhoto) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removePhoto}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us about yourself..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? (
            <>Updating...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Update Profile
            </>
          )}
        </Button>
      </form>
    </Form>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}