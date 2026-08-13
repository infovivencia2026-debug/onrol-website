import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { surveyDefinitions, type SurveyType } from "@/data/surveyConfig";
import { supabase } from "@/lib/supabase";
import onrolLogo from "@/assets/onrol-logo-home.png";
import surveyAssistantBot from "@/assets/survey-assistant-bot.png";

type AnswerValue = string | number;
type AnswersMap = Record<string, AnswerValue>;

const parseSurveyType = (value: string | undefined): SurveyType | null => {
  if (value === "student" || value === "professional") {
    return value;
  }

  return null;
};

const recommendationFromAnswers = (surveyType: SurveyType, answers: AnswersMap) => {
  const scores = {
    "AI Generalist": 0,
    "AI Product Manager": 0,
    "AI Automation Engineer": 0,
  };

  const getText = (id: string) => String(answers[id] ?? "").toLowerCase();
  const getNumber = (id: string) => Number(answers[id] ?? 0);

  if (surveyType === "professional") {
    const aiImpact = getText("q2_ai_impact");
    const incomeStreams = getText("q4_income_streams");
    const timeCommitment = getText("q5_time_commitment");
    const pricingGeneralist = getText("q6_pricing_ai_generalist");
    const pricingPm = getText("q7_pricing_ai_pm");
    const pricingAutomation = getText("q8_pricing_ai_automation");
    const confidence = getNumber("q9_ai_confidence");

    if (aiImpact.includes("productive") || aiImpact.includes("changing")) {
      scores["AI Generalist"] += 2;
      scores["AI Automation Engineer"] += 1;
    }

    if (incomeStreams.includes("multiple") || incomeStreams.includes("thought")) {
      scores["AI Automation Engineer"] += 2;
      scores["AI Product Manager"] += 1;
    }

    if (timeCommitment.includes("10-15") || timeCommitment.includes("15+")) {
      scores["AI Product Manager"] += 1;
      scores["AI Automation Engineer"] += 1;
    }

    if (pricingGeneralist.includes("okay") || pricingGeneralist.includes("interested")) {
      scores["AI Generalist"] += 3;
    }

    if (pricingPm.includes("fair") || pricingPm.includes("mentor") || pricingPm.includes("roadmap")) {
      scores["AI Product Manager"] += 3;
    }

    if (pricingAutomation.includes("worth") || pricingAutomation.includes("roi") || pricingAutomation.includes("invest")) {
      scores["AI Automation Engineer"] += 3;
    }

    if (confidence <= 4) {
      scores["AI Generalist"] += 2;
    } else if (confidence >= 7) {
      scores["AI Automation Engineer"] += 2;
      scores["AI Product Manager"] += 1;
    }
  } else {
    const salaryTarget = getText("q3_salary_target");
    const aiAwareness = getText("q4_ai_awareness");
    const confidence = getNumber("q6_ai_confidence");
    const pricingGeneralist = getText("q7_pricing_ai_generalist");
    const pricingPm = getText("q8_pricing_ai_pm");
    const pricingAutomation = getText("q9_pricing_ai_automation");

    if (salaryTarget.includes("exactly") || salaryTarget.includes("double-digit")) {
      scores["AI Product Manager"] += 1;
      scores["AI Automation Engineer"] += 1;
    }

    if (aiAwareness.includes("already") || aiAwareness.includes("heard")) {
      scores["AI Generalist"] += 2;
    }

    if (pricingGeneralist.includes("fair") || pricingGeneralist.includes("interested") || pricingGeneralist.includes("consider")) {
      scores["AI Generalist"] += 3;
    }

    if (pricingPm.includes("worth") || pricingPm.includes("evaluate") || pricingPm.includes("path")) {
      scores["AI Product Manager"] += 3;
    }

    if (pricingAutomation.includes("real automation") || pricingAutomation.includes("roi") || pricingAutomation.includes("invest")) {
      scores["AI Automation Engineer"] += 3;
    }

    if (confidence <= 4) {
      scores["AI Generalist"] += 2;
    } else if (confidence >= 7) {
      scores["AI Automation Engineer"] += 2;
      scores["AI Product Manager"] += 1;
    }
  }

  return (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "AI Generalist") as
    | "AI Generalist"
    | "AI Product Manager"
    | "AI Automation Engineer";
};

const SurveyForm = () => {
  const { surveyType } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const parsedType = parseSurveyType(surveyType);
  const definition = parsedType ? surveyDefinitions[parsedType] : null;

  const initialAnswers = useMemo<AnswersMap>(() => {
    if (!definition) {
      return {};
    }

    return definition.questions.reduce<AnswersMap>((acc, question) => {
      if (question.type === "slider") {
        acc[question.id] = question.min ?? 1;
      } else {
        acc[question.id] = "";
      }

      return acc;
    }, {});
  }, [definition]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [detailsCompleted, setDetailsCompleted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>(initialAnswers);
  const [submitting, setSubmitting] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantPosition, setAssistantPosition] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    setName("");
    setEmail("");
    setMobile("");
    setCompanyName("");
    setDetailsCompleted(false);
    setIndex(0);
    setAnswers(initialAnswers);
  }, [initialAnswers]);

  if (!definition || !parsedType) {
    return <Navigate to="/survey" replace />;
  }

  const currentQuestion = definition.questions[index];

  const sliderValue = currentQuestion.type === "slider" ? Number(answers[currentQuestion.id] ?? currentQuestion.min ?? 1) : 0;
  const singleValue = currentQuestion.type === "single" ? String(answers[currentQuestion.id] ?? "") : "";
  const textValue = currentQuestion.type === "text" ? String(answers[currentQuestion.id] ?? "") : "";

  const canAnswerCurrent = (() => {
    if (currentQuestion.optional) {
      return true;
    }

    if (currentQuestion.type === "slider") {
      return Number.isFinite(sliderValue);
    }

    if (currentQuestion.type === "single") {
      return singleValue.trim().length > 0;
    }

    return textValue.trim().length > 0;
  })();

  const canProceed = name.trim() !== "" && canAnswerCurrent;
  const isLastStep = index === definition.questions.length - 1;
  const progressPercent = Math.round(((index + 1) / definition.questions.length) * 100);
  const canStartSurvey = name.trim() !== "";
  const assistantTip = detailsCompleted
    ? isLastStep
      ? "Final step. Pick your best answer and submit to get your recommended program."
      : `Tip: choose the option that is most true for you right now. ${currentQuestion.insight.heading}`
    : "Add your basic details first. Then I will guide you question by question.";

  const goNext = () => {
    if (!canProceed) {
      return;
    }

    setIndex((value) => Math.min(value + 1, definition.questions.length - 1));
  };

  const goPrevious = () => {
    setIndex((value) => Math.max(0, value - 1));
  };

  const moveAssistantToNextPosition = () => {
    setAssistantPosition((previous) => {
      if (previous === 1) return 2;
      if (previous === 2) return 3;
      return 1;
    });
  };

  const submitSurvey = async () => {
    if (!canProceed || !name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter your name before submitting.",
        variant: "destructive",
      });
      return;
    }

    const recommendedProgram = recommendationFromAnswers(parsedType, answers);

    try {
      setSubmitting(true);

      const payload: {
        respondent_name: string;
        respondent_email?: string;
        respondent_mobile?: string;
        respondent_company?: string;
        recommended_program?: string;
        answers: AnswersMap;
      } = {
        respondent_name: name.trim(),
        recommended_program: recommendedProgram,
        answers,
      };

      if (email.trim()) {
        payload.respondent_email = email.trim();
      }

      if (mobile.trim()) {
        payload.respondent_mobile = mobile.trim();
      }

      if (parsedType === "professional" && companyName.trim()) {
        payload.respondent_company = companyName.trim();
      }

      const { error } = await supabase.from(definition.tableName).insert(payload);

      if (error) {
        throw error;
      }

      if (definition.webhookUrl) {
        try {
          const webhookPayload = {
            survey_type: parsedType,
            table_name: definition.tableName,
            respondent_name: name.trim(),
            respondent_email: email.trim() || null,
            respondent_mobile: mobile.trim() || null,
            respondent_company: parsedType === "professional" && companyName.trim() ? companyName.trim() : null,
            answers,
            recommended_program: recommendedProgram,
            created_at: new Date().toISOString(),
            event: "survey_completed",
          };

          await fetch(definition.webhookUrl, {
            method: "POST",
            body: JSON.stringify(webhookPayload),
            headers: {
              "Content-Type": "application/json",
            },
          });
        } catch {
          // Non-blocking path: survey data is already saved in Supabase.
        }
      }

      toast({
        title: "Success",
        description: "Your survey has been submitted.",
      });

      navigate(`/survey/thank-you?type=${parsedType}&program=${encodeURIComponent(recommendedProgram)}`, { replace: true });
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please retry once. Your response was not saved.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      className={`survey-shell apple-ui min-h-screen px-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-4 ${
        detailsCompleted ? "py-2 sm:py-8" : "py-5 sm:py-10"
      }`}
    >
      <div className="mx-auto relative flex w-full max-w-3xl flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center" aria-label="ONROL logo">
            <img src={onrolLogo} alt="ONROL" className="h-9 w-auto object-contain sm:h-10" />
          </div>
          <Button
            variant="outline"
            asChild
            className="survey-btn-secondary h-10 px-4"
          >
            <Link to="/survey">Change survey</Link>
          </Button>
        </div>

        {!detailsCompleted && (
          <div className="survey-panel p-4 sm:p-7">
            <div>
              <p className="survey-chip inline-flex px-3 py-1 text-[11px]">
                ONROL Survey - Contact Details
              </p>
              <h1 className="apple-heading-display onrol-heading-gradient-dark mt-3 text-[clamp(1.45rem,5.8vw,2.2rem)]">
                {definition.title}
              </h1>
            </div>
            <p className="mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">{definition.intro}</p>
          </div>
        )}

        {!detailsCompleted ? (
          <Card className="survey-panel overflow-hidden">
            <CardHeader className="space-y-2 p-4 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="text-[clamp(1.2rem,4.6vw,1.6rem)] font-semibold leading-tight text-slate-100">
                Enter Your Contact Details
              </CardTitle>
              <p className="text-sm text-slate-300/90">These details are captured once. Survey questions begin on the next page.</p>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-2 sm:p-6 sm:pt-2">
              <div>
                <label htmlFor="survey-name" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300/85">
                  Name *
                </label>
                <Input
                  id="survey-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                  className="survey-input"
                  required
                />
              </div>
              <div>
                <label htmlFor="survey-email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300/85">
                  Email (optional)
                </label>
                <Input
                  id="survey-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="your.email@example.com"
                  className="survey-input"
                />
              </div>

              <div>
                <label htmlFor="survey-mobile" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300/85">
                  Mobile Number (optional)
                </label>
                <Input
                  id="survey-mobile"
                  type="tel"
                  value={mobile}
                  onChange={(event) => setMobile(event.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="survey-input"
                />
              </div>

              {parsedType === "professional" && (
                <div>
                  <label htmlFor="survey-company" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300/85">
                    Company Name (optional)
                  </label>
                  <Input
                    id="survey-company"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="Your company name"
                    className="survey-input"
                  />
                </div>
              )}

              <div className="flex justify-end pt-1">
                <Button
                  className="survey-btn-primary h-11 w-full px-6 sm:w-auto"
                  disabled={!canStartSurvey || submitting}
                  onClick={() => setDetailsCompleted(true)}
                >
                  Start Survey <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card key={currentQuestion.id} className="survey-panel apple-slide-in relative flex flex-col overflow-hidden">
            <CardHeader className="space-y-3 p-3 pb-2 sm:space-y-4 sm:p-6 sm:pb-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.15em] text-muted-foreground">
                <span className="survey-chip px-3 py-1 text-[10px]">
                  Question {index + 1} of {definition.questions.length}
                </span>
                <span className="font-semibold text-foreground/70">{progressPercent}%</span>
              </div>

              <div className="apple-progress-track w-full overflow-hidden">
                <div className="apple-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>

              <CardTitle className="apple-heading-display text-[clamp(1.2rem,4.9vw,1.75rem)] text-slate-100">{currentQuestion.title}</CardTitle>
              {currentQuestion.subtitle && <p className="text-sm leading-relaxed text-slate-300">{currentQuestion.subtitle}</p>}
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-4 p-3 pt-2 sm:gap-4 sm:p-6 sm:pt-1">
              <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-4">
                <div className="space-y-4 sm:space-y-4">
                  {currentQuestion.type === "single" &&
                    currentQuestion.options?.map((option, optionIndex) => {
                      const checked = singleValue === option;

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            {
                              setAnswers((previous) => ({
                                ...previous,
                                [currentQuestion.id]: option,
                              }));
                              moveAssistantToNextPosition();
                            }
                          }
                          className={`apple-option-reveal survey-answer-option w-full p-3.5 text-left sm:p-4 ${
                            checked ? "survey-answer-option-active" : ""
                          }`}
                          style={{ animationDelay: `${optionIndex * 40}ms` }}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-200 ${
                                checked ? "scale-105 border-orange-300 bg-cyan-300 text-[#f3f5f8]" : "border-border bg-transparent"
                              }`}
                            >
                              {checked && <Check className="h-3.5 w-3.5" />}
                            </span>
                            <span className="text-sm leading-relaxed sm:text-base">{option}</span>
                          </div>
                        </button>
                      );
                    })}

                  {currentQuestion.type === "slider" && (
                    <div className="survey-insight-panel space-y-4 p-4 sm:p-5">
                      <Slider
                        className="survey-slider"
                        min={currentQuestion.min ?? 1}
                        max={currentQuestion.max ?? 10}
                        step={1}
                        value={[sliderValue]}
                        onValueChange={(value) => {
                          const nextValue = value[0] ?? currentQuestion.min ?? 1;
                          setAnswers((previous) => ({
                            ...previous,
                            [currentQuestion.id]: nextValue,
                          }));
                        }}
                        onValueCommit={() => moveAssistantToNextPosition()}
                      />
                      <div className="flex items-center justify-between text-xs text-slate-300 sm:text-sm">
                        <span>{currentQuestion.minLabel}</span>
                        <span>{currentQuestion.maxLabel}</span>
                      </div>
                      <div className="text-center text-[clamp(2rem,9vw,2.6rem)] font-semibold tracking-tight text-orange-200">{sliderValue}</div>
                    </div>
                  )}

                  {currentQuestion.type === "text" && (
                    <Textarea
                      id={`survey-${currentQuestion.id}`}
                      value={textValue}
                      onChange={(event) => {
                        setAnswers((previous) => ({
                          ...previous,
                          [currentQuestion.id]: event.target.value,
                        }));
                      }}
                      onBlur={() => moveAssistantToNextPosition()}
                      placeholder={currentQuestion.placeholder ?? "Type your response"}
                      className="min-h-32 rounded-2xl border-border/80 bg-background/90 leading-relaxed sm:min-h-36"
                    />
                  )}
                </div>

                <aside className="apple-sticky-wrap hidden lg:block">
                  <div className="survey-insight-panel p-3.5 pl-4.5 sm:p-5 sm:pl-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="survey-insight-kicker">Market Insight</span>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">{currentQuestion.insight.heading}</p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">{currentQuestion.insight.body}</p>
                    {currentQuestion.insight.source && (
                      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/95">Source: {currentQuestion.insight.source}</p>
                    )}
                  </div>
                </aside>
              </div>

              <div className="survey-insight-panel apple-mobile-insight p-4 pl-5 lg:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="survey-insight-kicker">Market Insight</span>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">{currentQuestion.insight.heading}</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">{currentQuestion.insight.body}</p>
                {currentQuestion.insight.source && (
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/95">Source: {currentQuestion.insight.source}</p>
                )}
              </div>

              <div className="-mx-3 -mb-3 rounded-b-2xl border-t border-slate-400/20 bg-[#f3f5f8]/75 px-3 pb-3 pt-3 sm:-mx-6 sm:-mb-6 sm:px-6 sm:pb-6">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <Button
                  variant="outline"
                  className="survey-btn-secondary h-11 w-full px-5 sm:w-auto"
                  onClick={() => {
                    if (index === 0) {
                      setDetailsCompleted(false);
                      return;
                    }

                    goPrevious();
                  }}
                  disabled={submitting}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> {index === 0 ? "Edit Details" : "Previous"}
                </Button>

                {!isLastStep ? (
                  <Button
                    className="survey-btn-primary h-11 w-full px-5 sm:w-auto"
                    onClick={goNext}
                    disabled={!canProceed || submitting}
                  >
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    className="survey-btn-primary h-11 w-full px-6 sm:w-auto"
                    onClick={submitSurvey}
                    disabled={!canProceed || submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting
                      </>
                    ) : (
                      "Complete Survey"
                    )}
                  </Button>
                )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {detailsCompleted ? (
        <div className={`survey-assistant-overlay ${detailsCompleted ? `survey-assistant-pos-${assistantPosition}` : "survey-assistant-pos-idle"}`}>
          {assistantOpen && (
            <div className="survey-assistant-bubble" role="status" aria-live="polite">
              {assistantTip}
            </div>
          )}
          <button
            type="button"
            className="survey-assistant-btn"
            onClick={() => setAssistantOpen((value) => !value)}
            aria-expanded={assistantOpen}
            aria-label="Toggle survey assistant"
          >
            <span className="survey-assistant-orb" aria-hidden="true" />
            <img src={surveyAssistantBot} alt="Survey assistant" className="survey-assistant-image" />
          </button>
        </div>
        ) : null}
      </div>
    </main>
  );
};

export default SurveyForm;
