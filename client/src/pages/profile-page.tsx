import { ProfileForm } from "@/components/profile/profile-form";

export default function ProfilePage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-gray-600">Manage your personal information and preferences</p>
      </div>
      
      <ProfileForm title="Edit Profile" showCard={true} />
    </div>
  );
}