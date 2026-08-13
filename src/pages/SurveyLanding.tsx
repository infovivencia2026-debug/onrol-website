import { Link } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { surveyRouteMeta } from "@/data/surveyConfig";
import onrolLogo from "@/assets/onrol-logo-home.png";

const iconByType = {
  student: GraduationCap,
  professional: BriefcaseBusiness,
};

const SurveyLanding = () => {
  return (
    <main className="survey-shell apple-ui min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="text-center">
          <img src={onrolLogo} alt="ONROL" className="mx-auto mb-5 h-10 w-auto object-contain sm:h-12" />
          <p className="survey-chip mx-auto inline-flex px-4 py-1 text-[11px]">ONROL Survey</p>
          <h1 className="apple-heading-display onrol-heading-gradient-dark mt-3 text-[clamp(2rem,6vw,3.2rem)]">
            Choose Your Diagnostic
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            This guided survey takes around 3 minutes. Pick the option that matches you and continue.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {surveyRouteMeta.map((item) => {
            const Icon = iconByType[item.type];

            return (
              <Card
                key={item.type}
                className="survey-panel apple-premium-card group relative flex h-full flex-col overflow-hidden"
              >
                <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl transition-all duration-500 group-hover:scale-125 group-hover:bg-primary/20" />
                <CardHeader className="relative z-10 pb-2">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-orange-300/35 bg-orange-400/15 text-orange-200">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="apple-heading-display text-2xl text-slate-100">{item.title}</CardTitle>
                  <CardDescription className="text-base text-slate-300">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 mt-auto">
                  <Button asChild size="lg" className="survey-btn-primary w-full justify-between text-base">
                    <Link to={item.path}>
                      Start Survey
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
};

export default SurveyLanding;
