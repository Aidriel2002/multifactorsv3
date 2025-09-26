import RuijieSidebar from '@/app/components/sidebars/ruijie-sidebar'

export default function RuijieLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <RuijieSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}