import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import onrolLogo from "@/assets/onrol-logo-home.png";

const SurveyThankYou = () => {
  const [params] = useSearchParams();
  const surveyType = params.get("type");
  const recommendedProgram = params.get("program") || "AI Generalist";

  const audienceLabel = surveyType === "student" ? "College Student" : "Working Professional";

  const recommendationCopy: Record<string, string> = {
    "AI Generalist": "Best if you want a strong practical foundation across tools, execution, and real-world AI workflows.",
    "AI Product Manager": "Best if you want to combine product thinking, AI use cases, and high-impact roadmap execution.",
    "AI Automation Engineer": "Best if you want to build automations, AI agents, and workflow systems that create measurable output.",
  };

  const recommendationReason =
    recommendationCopy[recommendedProgram] ??
    "Based on your responses, this path offers the strongest near-term leverage for your goals.";

  return (
    <main className="survey-shell apple-ui flex min-h-screen items-center justify-center px-3 py-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-10">
      <Card className="survey-panel w-full max-w-xl">
        <CardHeader className="px-5 pt-6 text-center sm:px-8 sm:pt-7">
          <img src={onrolLogo} alt="ONROL" className="mx-auto mb-5 h-10 w-auto object-contain sm:h-12" />
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-primary/25 bg-primary/12 text-primary">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <CardTitle className="apple-heading-display onrol-heading-gradient-dark text-[clamp(1.7rem,7vw,2rem)]">Thank You</CardTitle>
          <CardDescription className="text-base text-slate-300">
            Your {audienceLabel} survey response has been submitted successfully.
          </CardDescription>

          <div className="mt-4 rounded-2xl border border-orange-200/25 bg-[#f3f5f8]/70 p-4 text-left sm:p-5">
            <p className="survey-chip inline-flex px-3 py-1 text-[11px]">Recommended Path</p>
            <p className="mt-2 text-xl font-semibold tracking-tight text-slate-100">{recommendedProgram}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{recommendationReason}</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 px-5 pb-6 sm:px-8 sm:pb-7">
          <Button asChild className="survey-btn-primary h-11 w-full">
            <Link to={recommendedProgram === "AI Automation Engineer" ? "/programs/ai-architect" : "/programs/ai-generalist"}>
              See recommended roadmap
            </Link>
          </Button>
          <div className="flex flex-col gap-3">
            <Button asChild variant="outline" className="survey-btn-secondary h-11 w-full">
              <Link to="/survey">Submit another response</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default SurveyThankYou;
