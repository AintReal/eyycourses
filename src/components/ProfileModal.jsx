import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCamera, faUser, faEnvelope, faTrash, faChartBar } from '@fortawesome/free-solid-svg-icons';
import LoadingLogo from './LoadingLogo';
import Progress from './Progress';
import ComponentErrorBoundary from './ComponentErrorBoundary';
import ImageCropModal from './ImageCropModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { readFile } from '../utils/cropImage';
import { useTranslation } from '../../node_modules/react-i18next';

const ProfileModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { session } = UserAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'progress'
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    profile_picture_url: ''
  });
  const [tempName, setTempName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsAnimating(true), 10);
      setActiveTab('profile'); // Reset to profile tab when opening
    } else {
      setIsAnimating(false);
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && session?.user) {
      fetchProfile();
    }
  }, [isOpen, session]);

  const fetchProfile = async () => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            user_id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || ''
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        data = newProfile;
      } else if (error) {
        throw error;
      }

      if (data) {
        setProfile(data);
        setTempName(data.name || '');
      }
    } catch (err) {
      setError('Failed to load profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    if (!tempName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: tempName.trim() })
        .eq('user_id', session.user.id);

      if (error) throw error;

      setProfile({ ...profile, name: tempName.trim() });
      setSuccess('Name updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      e.target.value = ''; // Reset input
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      e.target.value = ''; // Reset input
      return;
    }

    setError('');
    
    try {
      // Read the file and open crop modal
      const imageDataUrl = await readFile(file);
      setImageToCrop(imageDataUrl);
      setIsCropModalOpen(true);
    } catch (err) {
      setError('Failed to load image');
    } finally {
      // Always reset the input so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleCropComplete = async (croppedFile) => {
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Delete old profile picture if exists
      if (profile.profile_picture_url) {
        const oldPath = profile.profile_picture_url.split('/').pop();
        await supabase.storage
          .from('profile-pictures')
          .remove([`${session.user.id}/${oldPath}`]);
      }

      // Upload the cropped image
      const fileExt = 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, croppedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('user_id', session.user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, profile_picture_url: publicUrl });
      setSuccess('Profile picture updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload profile picture');
    } finally {
      setUploading(false);
      setIsCropModalOpen(false);
      setImageToCrop(null);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!profile.profile_picture_url) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const oldPath = profile.profile_picture_url.split('/').pop();
      await supabase.storage
        .from('profile-pictures')
        .remove([`${session.user.id}/${oldPath}`]);

      const { error } = await supabase
        .from('profiles')
        .update({ profile_picture_url: null })
        .eq('user_id', session.user.id);

      if (error) throw error;

      setProfile({ ...profile, profile_picture_url: '' });
      setSuccess('Profile picture deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setIsDeleteModalOpen(false);
    } catch (err) {
      setError('Failed to delete profile picture');
    } finally {
      setUploading(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-md z-100 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      >
        <div 
          className={`bg-zinc-950/95 backdrop-blur-lg rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-800 shadow-2xl transition-all duration-300 ease-out ${
            isAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 z-10">
          <div className="p-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t('profile')}</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors p-2"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-zinc-800 px-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 rounded-t-lg ${
                activeTab === 'profile'
                  ? 'text-white border-b-2 border-blue-500 bg-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900/50'
              }`}
            >
              <FontAwesomeIcon icon={faUser} />
              {t('personalInfo')}
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 rounded-t-lg ${
                activeTab === 'progress'
                  ? 'text-white border-b-2 border-blue-500 bg-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900/50'
              }`}
            >
              <FontAwesomeIcon icon={faChartBar} />
              {t('myProgress')}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && activeTab === 'profile' ? (
            <div className="flex items-center justify-center py-12">
              <LoadingLogo size="lg" />
            </div>
          ) : (
            <>
              {/* Messages (only show on profile tab) */}
              {activeTab === 'profile' && error && (
                <div className="bg-red-950 border border-red-800 text-red-200 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {activeTab === 'profile' && success && (
                <div className="bg-green-950 border border-green-800 text-green-200 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              {/* Profile Tab Content */}
              {activeTab === 'profile' && (
                <>
              {/* Profile Picture Section */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                <h3 className="text-lg font-semibold mb-4">{t('profilePicture')}</h3>
                
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-zinc-800 border-4 border-zinc-700 overflow-hidden flex items-center justify-center">
                      {profile.profile_picture_url ? (
                        <img 
                          src={profile.profile_picture_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FontAwesomeIcon icon={faUser} className="text-4xl text-zinc-600" />
                      )}
                    </div>
                    
                    <label 
                      htmlFor="profile-picture-upload-modal"
                      className="absolute bottom-0 ltr:right-0 rtl:left-0 bg-zinc-700 hover:bg-zinc-600 w-8 h-8 rounded-full 
                               flex items-center justify-center cursor-pointer transition-colors border-2 border-zinc-900"
                    >
                      <FontAwesomeIcon icon={faCamera} className="text-white text-sm" />
                      <input
                        id="profile-picture-upload-modal"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <p className="text-zinc-400 text-xs">
                      {t('profilePictureInstructions')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center sm:justify-start">
                      <label 
                        htmlFor="profile-picture-upload-modal"
                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg cursor-pointer 
                                 transition-colors text-xs font-medium text-white flex items-center justify-center"
                      >
                        {uploading ? (
                          <span className="flex items-center justify-center gap-2">
                            <LoadingLogo size="sm" />
                            {t('uploading')}
                          </span>
                        ) : (
                          t('uploadPicture')
                        )}
                      </label>
                      
                      {profile.profile_picture_url && (
                        <button
                          onClick={() => setIsDeleteModalOpen(true)}
                          disabled={uploading}
                          className="px-4 py-2 bg-red-900 hover:bg-red-800 rounded-lg transition-colors 
                                   text-xs font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <FontAwesomeIcon icon={faTrash} className="ltr:mr-1 rtl:ml-1" />
                          {t('deletePicture')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Info Section */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                <h3 className="text-lg font-semibold mb-4">{t('personalInfo')}</h3>
                
                <form onSubmit={handleNameUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      <FontAwesomeIcon icon={faUser} className="ltr:mr-2 rtl:ml-2" />
                      {t('name')}
                    </label>
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm
                               text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                      placeholder={t('enterName')}
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      <FontAwesomeIcon icon={faEnvelope} className="ltr:mr-2 rtl:ml-2" />
                      {t('email')}
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm
                               text-zinc-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      {t('emailCannotChange')}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={saving || tempName.trim() === profile.name}
                    className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm
                             rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoadingLogo size="sm" />
                        {t('saving')}
                      </span>
                    ) : (
                      t('saveChanges')
                    )}
                  </button>
                </form>
              </div>

              {/* Account Info */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                <h3 className="text-lg font-semibold mb-3">{t('accountInfo')}</h3>
                <div className="space-y-2 text-sm text-zinc-400">
                  <p>
                    <span className="font-medium text-zinc-300">{t('memberSince')}:</span>{' '}
                    <span className="ltr:ml-2 rtl:mr-2">
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-zinc-300">{t('lastUpdated')}:</span>{' '}
                    <span className="ltr:ml-2 rtl:mr-2">
                      {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </span>
                  </p>
                </div>
              </div>
                </>
              )}

              {/* Progress Tab Content */}
              {activeTab === 'progress' && (
                <ComponentErrorBoundary fallbackTitle="Progress Error" fallbackMessage="Unable to load your progress data.">
                  <Progress />
                </ComponentErrorBoundary>
              )}
            </>
          )}
        </div>
      </div>
    </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => {
          setIsCropModalOpen(false);
          setImageToCrop(null);
        }}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteProfilePicture}
        isDeleting={uploading}
      />
    </>
  );
};

export default ProfileModal;
