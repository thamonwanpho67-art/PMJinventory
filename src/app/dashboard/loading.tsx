import LoadingSpinner from '@/components/LoadingSpinner';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      <LoadingSpinner 
        fullScreen 
        color="pink" 
        text="กำลังโหลด Dashboard..."
        size="xl"
      />
    </div>
  );
}