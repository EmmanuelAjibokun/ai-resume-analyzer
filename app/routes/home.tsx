import type { Route } from "./+types/home";
import Navbar from "../components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import {Link, useNavigate} from "react-router";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";
import resume from "~/routes/resume";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumine" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const { auth, kv } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);


  // redirect user after auth
  useEffect(() => {
    if(!auth.isAuthenticated) navigate('/auth?next=/')
  }, [auth.isAuthenticated])

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);

      const resumes = await kv.list('resume:*') as KVItem[];

      console.log("resumes: ", resumes);

      const res = await Promise.all(resumes?.map(async resume =>
          await kv.get(`${resume}`)
      ));

      const parsedResumes = res
          ?.map(resume => resume ? JSON.parse(resume) as Resume : null)
          .filter((resume): resume is Resume => resume !== null) ?? [];

      console.log(parsedResumes);
      setResumes(parsedResumes);
      setLoadingResumes(false);
    }

    loadResumes();
  }, []);

  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar />

    <section className="main-section">
      <div className="page-heading py-16">
        <h1>Track Your Applications & Resume Ratings</h1>
        {!loadingResumes && resumes.length === 0 ? (
          <h2>No resumes found. Upload your first resume to get feedback.</h2>
        ) : (
          <h2>Review your submissions and check AI-powered feedback.</h2>
        )}
      </div>
      {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]"></img>
          </div>
      )}
      {!loadingResumes && resumes.length > 0 && (
        <div className="resumes-section">
          {resumes.map((resume) => (
            <ResumeCard key={resume.id} resume={resume}/>
          ))}
        </div>
      )}

      {!loadingResumes && resumes.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
              Upload Resume
            </Link>
          </div>
      )}
    </section>

  </main>;
}
