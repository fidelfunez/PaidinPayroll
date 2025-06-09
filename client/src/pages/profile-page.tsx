import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { ProfileForm } from "@/components/profile/profile-form";

export default function ProfilePage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const profilePhotoMutation = useMutation({
    mutationFn: async (profilePhoto: string) => {
      return await apiRequest("PATCH", "/api/user/profile-photo", { profilePhoto });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Profile photo updated",
        description: "Your profile photo has been successfully updated.",
      });
      setSelectedPhoto(null);
    },
    onError: () => {
      toast({
        title: "Error updating photo",
        description: "Failed to update profile photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const savePhoto = () => {
    if (selectedPhoto) {
      profilePhotoMutation.mutate(selectedPhoto);
    }
  };

  const removePhoto = () => {
    profilePhotoMutation.mutate("");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header title="Profile" subtitle="Manage your personal information" />
        
        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Photo Section */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Photo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-300 flex items-center justify-center">
                      {selectedPhoto || user?.profilePhoto ? (
                        <img 
                          src={selectedPhoto || user?.profilePhoto || ""} 
                          alt="Profile photo" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-slate-600" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Photo
                        </div>
                      </label>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      {selectedPhoto && (
                        <>
                          <Button onClick={savePhoto} disabled={profilePhotoMutation.isPending}>
                            Save
                          </Button>
                          <Button variant="outline" onClick={() => setSelectedPhoto(null)}>
                            Cancel
                          </Button>
                        </>
                      )}
                      {user?.profilePhoto && !selectedPhoto && (
                        <Button variant="outline" onClick={removePhoto}>
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload a photo to personalize your profile (max 2MB)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue={user?.firstName} />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue={user?.lastName} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user?.email} />
                </div>
                <div>
                  <Label htmlFor="btcAddress">Bitcoin Address</Label>
                  <Input id="btcAddress" defaultValue={user?.btcAddress || ""} placeholder="Enter your Bitcoin wallet address" />
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input id="street" placeholder="123 Main Street" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="New York" />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input id="state" placeholder="NY" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                    <Input id="zipCode" placeholder="10001" />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" placeholder="United States" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyName">Contact Name</Label>
                    <Input id="emergencyName" placeholder="John Doe" />
                  </div>
                  <div>
                    <Label htmlFor="emergencyRelation">Relationship</Label>
                    <Input id="emergencyRelation" placeholder="Spouse, Parent, etc." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyPhone">Phone Number</Label>
                    <Input id="emergencyPhone" placeholder="+1 (555) 123-4567" />
                  </div>
                  <div>
                    <Label htmlFor="emergencyEmail">Email</Label>
                    <Input id="emergencyEmail" type="email" placeholder="emergency@example.com" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button variant="outline">Cancel</Button>
              <Button>Save Changes</Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}