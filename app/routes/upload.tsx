import {type FormEvent, type JSX, useState} from "react";
import {useNavigate} from "react-router";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import { convertPdfToImage } from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import {prepareInstructions} from "../../constants";

const Upload: () => JSX.Element = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<{
        companyName?: string;
        jobTitle?: string;
        jobDescription?: string;
        file?: string;
    }>({});

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
        if(!imageFile.file) return setStatusText('Error: Failed to convert image to PDF.');
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
        await kv.set(`resume:${uuid}`, JSON.stringify(data));

        setStatusText('Analyzing');

        const feedback = await ai.feedback(
            uploadFile.path,
            prepareInstructions({jobTitle, jobDescription})
        )

        if(!feedback) return setStatusText('Error: Failed to analyze resume.');

        const feedbackText = typeof feedback.message.content === 'string' ? feedback.message.content : feedback.message.content[0].text;

        data.feedback = JSON.parse(feedbackText);

        await kv.set(`resume:${uuid}`, JSON.stringify(data));
        setStatusText('Analysis complete, redirecting...');
        console.log(data);
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if (!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        // Reset previous errors
        setErrors({});
        
        // Validate all required fields
        const newErrors: {
            companyName?: string;
            jobTitle?: string;
            jobDescription?: string;
            file?: string;
        } = {};
        
        if (!companyName || companyName.trim() === '') {
            newErrors.companyName = 'Company name is required';
        }
        
        if (!jobTitle || jobTitle.trim() === '') {
            newErrors.jobTitle = 'Job title is required';
        }
        
        if (!jobDescription || jobDescription.trim() === '') {
            newErrors.jobDescription = 'Job description is required';
        }
        
        if (!file) {
            newErrors.file = 'Resume file is required';
        }
        
        // If there are any errors, update the state and stop submission
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (!file) return setStatusText('Please upload a resume file.');

        // All validations passed, proceed with form submission
        try {
            handleAnalyze({companyName, jobTitle, jobDescription, file});
        } catch (error) {
            console.error('Error analyzing resume:', error);
            setStatusText('An error occurred while analyzing your resume. Please try again.');
        }
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
                                <input 
                                    type="text" 
                                    id="company-name" 
                                    name="company-name" 
                                    placeholder="Company Name"
                                    className={errors.companyName ? "border-red-500" : ""} 
                                />
                                {errors.companyName && (
                                    <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
                                )}
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input 
                                    type="text" 
                                    id="job-title" 
                                    name="job-title" 
                                    placeholder="Job Title"
                                    className={errors.jobTitle ? "border-red-500" : ""} 
                                />
                                {errors.jobTitle && (
                                    <p className="text-red-500 text-sm mt-1">{errors.jobTitle}</p>
                                )}
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea 
                                    rows={5} 
                                    id="job-description" 
                                    name="job-description" 
                                    placeholder="Job Description"
                                    className={errors.jobDescription ? "border-red-500" : ""} 
                                />
                                {errors.jobDescription && (
                                    <p className="text-red-500 text-sm mt-1">{errors.jobDescription}</p>
                                )}
                            </div>
                            <div className="form-div">
                                <label htmlFor="resume-upload">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect}/>
                                {errors.file && (
                                    <p className="text-red-500 text-sm mt-1">{errors.file}</p>
                                )}
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