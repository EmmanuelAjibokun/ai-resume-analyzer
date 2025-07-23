import {type FormEvent, type JSX, useState} from "react";
import {useNavigate} from "react-router";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import { convertPdfToImage } from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";

const Upload: () => JSX.Element = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const {fs, auth, ai, kv, isLoading} = usePuterStore();
    const navigate = useNavigate();

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: {
        companyName: string;
        jobTitle: string;
        jobDescription: string;
        file: File;
    }) => {
        setIsProcessing(true);
        setStatusText('Uploading the file...');

        const uploadFile = await fs.upload([file]);
        if(!uploadFile) return setStatusText('Error: Failed to upload file.');

        setStatusText('Converting to image...');

        const imageFile = await convertPdfToImage(file);
        if(!imageFile) return setStatusText('Error: Failed to convert image to PDF.');

        setStatusText('Uploading image...');
        const uploadImage = await fs.upload([imageFile.file]);
        if(!uploadImage) return setStatusText('Error: Failed to upload image.');

        const uuid = generateUUID();

        const data = {
            id: uuid,
            resumePath: uploadFile.path,
            imagePath: uploadImage.path,
            jobTitle, jobDescription, file,
            feedback: '',
        }

        // key value storage
        await kv.set(`resume: ${uuid}`, JSON.stringify(data));
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if (!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name');
        const jobTitle = formData.get('job-title');
        const jobDescription = formData.get('job-description');

        if(!file) return;

        // try catch response for handleAnalyze function
        handleAnalyze({companyName, jobTitle, jobDescription, file});
    }
    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full" alt="resume-scan-gif"/>
                        </>
                    ) : (
                        <h2>Drop your resume for an ATS score and improvement tips</h2>
                    )}
                    {!isProcessing && (
                        <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" id="company-name" name="company-name" placeholder="Company Name" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" id="job-title" name="job-title" placeholder="Job Title" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} id="job-description" name="job-description" placeholder="Job Description" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect}/>
                            </div>

                            <button className="primary-button" type="submit">
                                Analyze Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
};

export default Upload;