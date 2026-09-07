export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Your study overview at a glance.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Tasks Due", value: "—" },
          { title: "Study Time Today", value: "—" },
          { title: "Subjects", value: "—" },
        ].map((card) => (
          <div key={card.title} className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">{card.title}</p>
            <p className="text-3xl font-bold mt-2">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
