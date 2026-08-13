export const config = {
    developer: {
        name: "Siddhant",
        fullName: "Siddhant Jaiswal",
        title: "AI Engineer",
        description: "AI engineer building generative video and multimodal ML systems that run on consumer hardware. IEEE-published, one patent filed."
    },
    social: {
        github: "Siddhant220604",
        email: "siddjwal220594@gmail.com",
        location: "Lucknow / Jaipur, India"
    },
    about: {
        title: "About Me",
        description: "I work on the unglamorous half of applied AI: orchestration, VRAM budgets, model swapping and error handling — the parts that decide whether a research demo survives contact with real hardware. B.Tech in Information Technology from Manipal University Jaipur, 2022–2026, CGPA 8.45 with a perfect 10.00 in the final semester. One IEEE paper, one filed patent, and a cinematic video pipeline that runs end to end on an 8GB consumer GPU instead of a rented A100. Because a pipeline nobody can afford to run isn't a pipeline — it's a demo."
    },
    experiences: [
        {
            position: "Full-Stack Engineer",
            company: "Kiran Traders (client project)",
            period: "2026",
            location: "Lucknow, India",
            description: "Designed, built and deployed a live wholesale e-commerce platform for a disposable-packaging distributor, covering the full stack from API design to production server administration.",
            responsibilities: [
                "Built a REST API backend in FastAPI with Pydantic request validation",
                "Paired it with a React single-page frontend",
                "Integrated the Google Maps Distance Matrix API for distance-based delivery pricing",
                "Implemented pincode serviceability allow-lists and ran the Debian production server"
            ],
            technologies: ["FastAPI", "React", "MySQL", "Pydantic", "Google Maps API", "Debian"]
        },
        {
            position: "Patent Filed — Low-VRAM Video Generation",
            company: "Manipal University Jaipur",
            period: "2026",
            location: "Jaipur, India",
            description: "A resource-efficient method for automated cinematic video generation on consumer-grade hardware, filed as a patent application and shipped as capstone work alongside a perfect 10.00 final-semester GPA.",
            responsibilities: [
                "Structured input to finished cinematic video on an 8GB VRAM desktop",
                "n8n for scheduling, conditional logic and error recovery",
                "Ollama (Qwen2.5-7B, Llama 3) writing JSON storyboards",
                "ComfyUI running text-to-image, image-to-image and image-to-video with LTX 2.0"
            ],
            technologies: ["ComfyUI", "Ollama", "n8n", "LTX 2.0", "LoRA", "FFmpeg"]
        },
        {
            position: "AI Engineer Intern",
            company: "Atthah InfoMedia",
            period: "Jun – Jul 2025",
            location: "Gurgaon, India",
            description: "Evaluated and benchmarked generative media tooling, then built a prompt-driven music generation system that produced 50+ tracks across 10+ genres.",
            responsibilities: [
                "Evaluated n8n and ComfyUI for automating repetitive AI workflows",
                "Benchmarked lip-sync and face-swap models (VO3, SadTalker) for Indian-language storytelling",
                "Ran open-source vs. paid feasibility studies across image, text and video pipelines",
                "Built ACE Step with style transfer and an audio post-processing chain"
            ],
            technologies: ["Python", "ComfyUI", "n8n", "Deep Learning", "Audio DSP"]
        },
        {
            position: "Published in IEEE Xplore",
            company: "Multi-Modal Emotion Recognition",
            period: "Apr 2025",
            location: "India",
            description: "Co-authored research on fusing facial and speech signals for emotion classification, running a CNN over each modality and fusing them at feature level with global average pooling — beating both single-modality baselines.",
            responsibilities: [
                "Two-stream CNN over face frames and speech spectrograms",
                "Feature-level fusion with global average pooling",
                "Benchmarked against single-modality baselines",
                "Published to IEEE Xplore"
            ],
            technologies: ["Python", "TensorFlow", "Keras", "OpenCV", "Librosa", "NumPy"]
        },
        {
            position: "B.Tech, Information Technology",
            company: "Manipal University Jaipur",
            period: "2022 – 2026",
            location: "Jaipur, India",
            description: "CGPA 8.45 across the degree, with a perfect 10.00 in the final semester while shipping the patented pipeline as capstone work.",
            responsibilities: [
                "Core computer science, data structures and algorithms",
                "Machine learning, computer vision and signal processing",
                "Capstone: low-VRAM cinematic video generation",
                "Final-semester GPA 10.00"
            ],
            technologies: ["Python", "C / C++", "SQL", "Machine Learning"]
        }
    ],
    projects: [
        {
            id: 1,
            title: "Kiran Traders",
            category: "Production E-Commerce",
            technologies: "FastAPI, React, MySQL, Pydantic, Google Maps API, Debian",
            image: "/images/proj-kiran.png",
            description: "A live wholesale storefront for a disposable-packaging distributor — the whole stack, from API design to the production server it runs on. Distance Matrix pricing by actual road distance at checkout, and pincode allow-lists that stop orders the business can't service.",
            link: "https://kirantraderslko.in/"
        },
        {
            id: 2,
            title: "Low-VRAM AI Video Pipeline",
            category: "Generative Video · Patent Filed",
            technologies: "ComfyUI, Ollama, n8n, LTX 2.0, LoRA, FFmpeg",
            image: "/images/proj-vram.png",
            description: "Structured input goes into a Google Sheet; a finished cinematic video comes out — on an 8GB VRAM, 32GB RAM desktop instead of a rented A100. Character consistency holds across scenes through a base reference image with USO conditioning.",
            link: ""
        },
        {
            id: 3,
            title: "Multi-Modal Emotion Recognition",
            category: "Research · IEEE Published",
            technologies: "Python, TensorFlow, Keras, OpenCV, Librosa, NumPy",
            image: "/images/proj-emotion.png",
            description: "Faces lie less when you also listen. This system reads facial expression and speech together, runs a CNN over each modality, and fuses them at feature level before classification — beating both single-modality baselines.",
            link: "https://ieeexplore.ieee.org/document/11378143"
        },
        {
            id: 4,
            title: "AI-Generated Hindi Story Video",
            category: "Generative Media",
            technologies: "MidJourney, VO3, Prompt engineering, Audio sync",
            image: "/images/proj-hindi.png",
            description: "A written Hindi story turned into a full-length narrated video with the look of 2D animated storytelling — built to test whether regional-language content can be produced end to end with generative media.",
            link: "https://drive.google.com/file/d/1slch1XdEnTeVCxb29KDAufs-vt9JiMAq/view"
        },
        {
            id: 5,
            title: "ACE Step",
            category: "AI Music Generation",
            technologies: "Deep learning, Style transfer, Prompt interface, Audio post-processing",
            image: "/images/proj-ace.png",
            description: "A prompt-driven system that writes original music across genres. 50+ tracks across 10+ genre styles, with coherent structure, melodic consistency and genre-appropriate character. Built during the Atthah InfoMedia internship.",
            link: ""
        }
    ],
    contact: {
        email: "siddjwal220594@gmail.com",
        github: "https://github.com/Siddhant220604",
        linkedin: "https://linkedin.com/in/siddhant-jaiswal220604",
        twitter: "",
        facebook: "",
        instagram: ""
    },
    skills: {
        develop: {
            title: "AI ENGINEER",
            description: "Generative video and multimodal ML on hardware you already own",
            details: "Orchestration, VRAM budgets, model swapping and error handling — the parts that decide whether a research demo survives contact with real hardware. Pipelines that run end to end on a consumer GPU.",
            tools: ["Python", "TensorFlow", "OpenCV", "Librosa", "ComfyUI", "Ollama", "LTX 2.0", "LoRA", "n8n", "FFmpeg"]
        },
        design: {
            title: "FULL-STACK",
            description: "APIs and the interfaces on top of them",
            details: "REST APIs with FastAPI and Pydantic validation, React single-page frontends, MySQL, and the self-managed Debian servers they run on in production.",
            tools: ["FastAPI", "React", "Pydantic", "REST APIs", "MySQL", "Debian / Linux", "Git", "HTML & CSS", "C / C++", "SQL"]
        }
    }
};
