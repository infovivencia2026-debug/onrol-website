import React, { useState } from "react";

export default function OnrolDifference() {
  const modules = [
    { id: 1, label: "MODULE 1 (4 WEEKS)", title: "Data Foundations" },
    { id: 2, label: "MODULE 2 (20 WEEKS)", title: "ML Coding (Applied AI–ML)" },
    { id: 3, label: "MODULE 3 (28 WEEKS)", title: "LLM & Gen AI Engineering" },
    { id: 4, label: "MODULE 4 (8 WEEKS)", title: "Advanced ML, Advanced Deep ..." },
    { id: 5, label: "OPTIONAL (6 MONTHS)", title: "DSA" },
    { id: 6, label: "RECORDED (4 WEEKS)", title: "Big data" },
    { id: 7, label: "RECORDED (4 WEEKS)", title: "Reinforcement learning" },
  ];

  const [activeModule, setActiveModule] = useState(1);

  const comparisonData = [
    {
      feature: "Duration",
      onrol: "3 Months of intense building, followed by a 3-Month Agency Launchpad",
      competitors: "6 to 12 Months of prolonged academic theory.",
    },
    {
      feature: "Community",
      onrol: "One year access to the ONROL Community of AI enthusiasts.",
      competitors: "Limited peer support or short-term access.",
    },
    {
      feature: "Mentors",
      onrol: "Industry Experts from Tech giants who are active industry practitioners",
      competitors: "Regular Specialists or Generalists",
    },
    {
      feature: "Prerequisites",
      onrol: 'None. We use the natural language "Vibe Coding".',
      competitors: "Requires heavy coding, Python, Data Structures & Algorithms (DSA).",
    },
    {
      feature: "The Final Output",
      onrol: "3 Live Projects: A deployed Website, an n8n Automation System, and a Personal AI Assistant.",
      competitors: "Theoretical data models, Jupyter notebooks, or academic certificates.",
    },
    {
      feature: "Delivery Format",
      onrol: "Immersive, face-to-face Workshop.",
      competitors: "Lectures with asynchronous content.",
    },
    {
      feature: "The End Goal",
      onrol: "Enables multiple monetization modes. Aids learners launching a freelance career, an AI agency, or a startup.",
      competitors: "It takes time to convert to money.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f3ef] p-6 md:p-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        {/* Left Module Sidebar */}
        <div className="space-y-4">
          {modules.map((module) => {
            const isActive = activeModule === module.id;
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
                  isActive
                    ? "border-[#a78bfa] bg-[#faf7ff] shadow-sm"
                    : "border-[#ddd4c8] bg-[#f8f6f2] hover:border-[#c8b8f8]"
                }`}
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    isActive ? "text-[#9b87f5]" : "text-[#7f776d]"
                  }`}
                >
                  {module.label}
                </p>
                <h3 className="mt-2 text-[17px] font-bold text-[#2d2926]">
                  {module.title}
                </h3>
              </button>
            );
          })}
        </div>

        {/* Right Main Content */}
        <div className="overflow-hidden rounded-3xl border border-[#ddd4c8] bg-[#f8f6f2] shadow-sm">
          {/* Top section */}
          <div className="bg-[#f3f0fb] px-6 py-8 md:px-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#2d2926] md:text-5xl">
                  The Onrol Difference
                </h1>
                <p className="mt-2 text-lg font-semibold text-[#9b87f5]">
                  Why Learn With Us?
                </p>
              </div>

              <div className="rounded-xl bg-[#f7f2ff] px-4 py-2 text-sm font-semibold text-[#9b87f5]">
                Module 1 (4 weeks)
              </div>
            </div>

            <div className="rounded-2xl border border-[#ddd4c8] bg-[#f8f6f2] p-4 md:p-6">
              <h2 className="mb-4 text-xl font-bold text-[#2d2926]">
                Comparison Overview
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr>
                      <th className="rounded-l-xl bg-[#efe9ff] px-4 py-4 text-left text-sm font-bold text-[#2d2926]">
                        Feature
                      </th>
                      <th className="bg-[#dff7ea] px-4 py-4 text-left text-sm font-bold text-[#2d2926]">
                        Onrol
                      </th>
                      <th className="rounded-r-xl bg-[#f3ede5] px-4 py-4 text-left text-sm font-bold text-[#2d2926]">
                        Other Competitors
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {comparisonData.map((item, index) => (
                      <tr key={index}>
                        <td className="rounded-l-xl border border-r-0 border-[#e2d8cd] bg-white px-4 py-4 align-top text-sm font-semibold text-[#2d2926] md:w-[180px]">
                          {item.feature}
                        </td>
                        <td className="border border-[#d2eadb] bg-[#f4fff8] px-4 py-4 align-top text-sm leading-6 text-[#2d2926] md:w-[380px]">
                          {item.onrol}
                        </td>
                        <td className="rounded-r-xl border border-l-0 border-[#e2d8cd] bg-[#fffdf9] px-4 py-4 align-top text-sm leading-6 text-[#5a5148] md:w-[320px]">
                          {item.competitors}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="flex flex-col items-start justify-between gap-4 px-6 py-6 md:flex-row md:items-center md:px-8">
            <div>
              <h3 className="text-2xl font-bold text-[#2d2926]">
                Get the Complete Curriculum Picture
              </h3>
              <p className="mt-2 text-base text-[#9b87f5]">
                Download our brochure for a comprehensive overview
              </p>
            </div>

            <button className="rounded-2xl bg-[#a78bfa] px-6 py-4 text-base font-bold text-white shadow-md transition hover:scale-[1.02]">
              ↓ Download Brochure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
