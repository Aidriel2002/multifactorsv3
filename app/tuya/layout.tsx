import TuyaSidebar from '@/app/components/sidebars/tuya-sidebar'

export default function TuyaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <TuyaSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}