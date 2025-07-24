import {type JSX, useEffect, useState} from "react";
import {Link, useNavigate, useParams} from "react-router";
import {usePuterStore} from "~/lib/puter";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";

export const meta = () => ([
    { title: 'Resumine | Review' },
    {name: 'description', content: 'Detailed overview of your resume'},
])

const Resume: () => JSX.Element = () => {
    // http://localhost:5173/resume/90f53965-7461-4926-90f6-e2c0f2fc7e2a
    const { auth, isLoading, fs, kv } = usePuterStore();
    const {id} = useParams();
    const [imageUrl, setImageUrl] = useState<String>('');
    const [resumeUrl, setResumeUrl] = useState<String>('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const navigate = useNavigate();

    // redirect user after auth
    useEffect(() => {
        if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`)
    }, [isLoading])

    useEffect(() => {
        const loadResume = async () => {
            const resume = await kv.get(`resume:${id}`);

            if(!resume) return;

            const data = JSON.parse(resume);

            const resumeBlob = await fs.read((data.resumePath));
            if(!resumeBlob) return;

            const pdfBlob = new Blob([resumeBlob], {type: "application/pdf"});
            const resumeUrl = URL.createObjectURL(pdfBlob);
            setResumeUrl(resumeUrl);

            // load an image from the database
            const imageBlob = await fs.read((data.imagePath));
            if(!imageBlob) return;
            const imageUrl = URL.createObjectURL(imageBlob);
            setImageUrl(imageUrl);

            setFeedback(data.feedback);
        }

        loadResume()
    }, [id]);

    return (
        <main className="!pt-0">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icons/back.svg" alt="back-button-badge" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
                </Link>
            </nav>
            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-w-xl:h-fit w-fit">
                            <a href={resumeUrl.toString()} target="_blank" rel="noreferrer noopener"
                               className="w-full h-full">
                                <img src={`${imageUrl}`} alt="resume-image" className="w-full h-full object-contain rounded-2xl" />
                            </a>
                        </div>
                    )}
                </section>

                <section className="feedback-section">
                    <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
                    {feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback={feedback} />
                            <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || [0]} />
                            <Details feedback={feedback} />
                        </div>
                    ) : (
                        <img src="/images/resume-scan-2.gif" alt="loading" className="w-full" />
                    )}
                </section>
            </div>
        </main>
    );
};

export default Resume;