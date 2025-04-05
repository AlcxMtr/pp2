'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@heroui/react';
import { UserProfile } from '../../itineraries/BookingInterfaces';

export default function EditProfile() {
  const { accessToken, userId } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 0,
    firstName: '',
    lastName: '',
    email: '',
    profilePicture: '',
    phoneNumber: '',
    role: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/users/edit-profile', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: Number(userId) }),
        });
        if (!response.ok) throw new Error('Failed to fetch user profile');
        const data = await response.json();
        setUserProfile(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserProfile();
  }, [accessToken, userId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !userId) {
      alert('Please log in first');
      router.push('/login');
      return;
    }
    if (!userProfile.firstName || !userProfile.lastName || !userProfile.email) {
      alert('Please fill in all required fields: first name, last name, and email');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/users/edit-profile', {
        method: 'POST', // Changed from PUT to POST
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...userProfile,
          id: Number(userId),
        }),
      });
      if (res.ok) {
        router.push('/'); // Redirect to home or profile view page
      } else {
        const data = await res.json();

      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-10 bg-[var(--gray-bg-light)] dark:bg-gray-900">
      <div className="w-full max-w-2xl bg-[var(--card-bg-light)] dark:bg-black rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-8 text-center text-[var(--text-dark)] dark:text-[var(--lavender)]">
          Edit Profile
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <Input
              isRequired
              label="First Name"
              labelPlacement="outside"
              placeholder="Enter first name"
              value={userProfile.firstName}
              onChange={(e) =>
                setUserProfile({ ...userProfile, firstName: e.target.value })
              }
              errorMessage="Please enter your first name"
              className="w-full"
            />
          </div>
          <div className="space-y-6">
            <div className="flex gap-4 items-end">
                <Input
                isRequired
                label="Last Name"
                labelPlacement="outside"
                placeholder="Enter last name"
                value={userProfile.lastName}
                onChange={(e) =>
                    setUserProfile({ ...userProfile, lastName: e.target.value })
                }
                errorMessage="Please enter your last name"
                className="w-full"
                />
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex gap-4 items-end">
                <Input
                    isRequired
                    label="Email"
                    labelPlacement="outside"
                    placeholder="Enter email"
                    value={userProfile.email}
                    onChange={(e) =>
                        setUserProfile({ ...userProfile, email: e.target.value })
                    }
                    errorMessage="Please enter a valid email"
                    className="w-full"
                />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex gap-4 items-end">
                <Input
                    label="Profile Picture URL"
                    labelPlacement="outside"
                    placeholder="Enter profile picture URL"
                    value={userProfile.profilePicture}
                    onChange={(e) =>
                        setUserProfile({ ...userProfile, profilePicture: e.target.value })
                    }
                    className="w-full"
                />
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex gap-4 items-end">
                <Input
                    label="Phone Number"
                    labelPlacement="outside"
                    placeholder="Enter phone number"
                    value={userProfile.phoneNumber}
                    onChange={(e) =>
                        setUserProfile({ ...userProfile, phoneNumber: e.target.value })
                    }
                    className="w-full"
                />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-semibold py-2 rounded-lg hover:bg-gray-700 dark:bg-white dark:text-black"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>
      </div>
    </div>
  );
}