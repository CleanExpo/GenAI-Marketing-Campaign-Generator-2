import React, { useState } from 'react';
import { CampaignResult } from '../types';
import { AnalysisCard } from './AnalysisCard';
import { LoadingSpinner, ExternalLinkIcon } from './icons';
import { generateImageFromPrompt } from '../services/geminiService';

interface ResultsDisplayProps {
  results: CampaignResult | null;
  isLoading: boolean;
  error: string | null;
  companyName: string;
}

const ImageResult: React.FC<{ prompt: string }> = ({ prompt }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const url = await generateImageFromPrompt(prompt);
            setImageUrl(url);
        } catch (err) {
            setError('Failed to generate image. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-4 bg-slate-700/50 rounded-lg">
            <p className="italic text-slate-400">"{prompt}"</p>
            <div className="mt-3">
                {!imageUrl && (
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-sm text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 flex items-center"
                    >
                        {isGenerating ? (
                            <>
                                <LoadingSpinner />
                                <span className="ml-2">Generating...</span>
                            </>
                        ) : (
                            'Generate Image'
                        )}
                    </button>
                )}
            </div>
            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
            {imageUrl && <img src={imageUrl} alt={prompt} className="mt-3 rounded-lg shadow-md w-full max-w-sm mx-auto" />}
        </div>
    );
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, isLoading, error, companyName }) => {
  if (isLoading) {
    return (
      <div className="text-center p-10 bg-slate-800/50 rounded-lg mt-8 border border-slate-700">
        <div className="flex justify-center items-center mb-4">
          <LoadingSpinner />
        </div>
        <p className="text-xl text-cyan-400 animate-pulse-fast">Generating Your Campaign...</p>
        <p className="text-slate-400 mt-2">The AI is crafting your marketing strategy. This might take a moment.</p>
      </div>
    );
  }

  if (error) {
    return (
        <div className="text-center p-10 bg-red-900/50 border border-red-700 rounded-lg mt-8">
            <p className="text-xl text-red-400">An Error Occurred</p>
            <p className="text-slate-300 mt-2">{error}</p>
        </div>
    );
  }

  if (!results) {
    return (
        <div className="text-center p-10 bg-slate-800/50 rounded-lg mt-8 border border-slate-700">
            <p className="text-xl text-slate-400">Your results will appear here.</p>
        </div>
    );
  }
  
  const generateSocialUrl = (platform: string, brandName: string): string => {
    const sanitizedBrand = brandName.replace(/\s+/g, '').toLowerCase() || 'yourbrandname';
    const platformKey = platform.toLowerCase().split(' ')[0];
    
    switch (platformKey) {
        case 'facebook':
            return `https://facebook.com/${sanitizedBrand}`;
        case 'instagram':
            return `https://instagram.com/${sanitizedBrand}`;
        case 'x':
        case 'twitter':
            return `https://x.com/${sanitizedBrand}`;
        case 'linkedin':
            return `https://linkedin.com/company/${sanitizedBrand}`;
        case 'tiktok':
            return `https://tiktok.com/@${sanitizedBrand}`;
        case 'reddit':
            return `https://reddit.com/r/${sanitizedBrand}`;
        default:
            return '#';
    }
  };


  return (
    <div className="space-y-6 mt-8">
      <AnalysisCard title="Target Audience">
        <p>{results.targetAudience}</p>
      </AnalysisCard>

      <AnalysisCard title="Key Messaging">
        <ul className="list-disc list-inside space-y-2">
          {results.keyMessaging.map((msg, i) => <li key={i}>{msg}</li>)}
        </ul>
      </AnalysisCard>
      
      {results.metaData && (
        <AnalysisCard title="SEO Meta Data">
            <div className="space-y-2">
                <p><strong className="font-semibold text-slate-100">Title:</strong> {results.metaData.title}</p>
                <p><strong className="font-semibold text-slate-100">Description:</strong> {results.metaData.description}</p>
            </div>
        </AnalysisCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnalysisCard title="Social Media Strategy">
          <div className="space-y-4">
            {results.socialMediaStrategy.map((item, i) => (
              <div key={i}>
                <h4 className="font-bold text-slate-100 flex items-center">
                  <a href={generateSocialUrl(item.platform, companyName)} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center">
                    {item.platform}
                    <ExternalLinkIcon className="h-4 w-4 ml-1.5 text-slate-400"/>
                  </a>
                </h4>
                <p className="text-sm">{item.strategy}</p>
              </div>
            ))}
          </div>
        </AnalysisCard>

        <AnalysisCard title="SEO Keywords">
          <div className="flex flex-wrap gap-2">
            {results.seoKeywords.map((kw, i) => <span key={i} className="bg-slate-700 text-cyan-300 text-sm font-medium px-2.5 py-1 rounded-full">{kw}</span>)}
          </div>
        </AnalysisCard>
      </div>

       {results.trendingTopics && results.trendingTopics.length > 0 && (
        <AnalysisCard title="Trending Topic Ideas">
          <div className="space-y-4">
            {results.trendingTopics.map((item, i) => (
              <div key={i}>
                <h4 className="font-bold text-slate-100">{item.topic}</h4>
                <p className="text-sm">{item.angle}</p>
              </div>
            ))}
          </div>
        </AnalysisCard>
      )}

      <AnalysisCard title="Ad Copy Examples">
        <div className="space-y-4">
          {results.adCopy.map((ad, i) => (
            <div key={i} className="p-3 bg-slate-700/50 rounded-md">
              <p><strong className="font-semibold text-slate-100">Headline:</strong> {ad.headline}</p>
              <p><strong className="font-semibold text-slate-100">Body:</strong> {ad.body}</p>
            </div>
          ))}
        </div>
      </AnalysisCard>

      {results.backlinkStrategy && results.backlinkStrategy.length > 0 && (
         <AnalysisCard title="Backlink Strategy">
            <ul className="list-disc list-inside space-y-2">
                {results.backlinkStrategy.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
        </AnalysisCard>
      )}

      {results.aiImagePrompts && results.aiImagePrompts.length > 0 && (
        <AnalysisCard title="AI Image Prompts">
          <div className="space-y-4">
            {results.aiImagePrompts.map((prompt, i) => <ImageResult key={i} prompt={prompt} />)}
          </div>
        </AnalysisCard>
      )}

      {results.aiVideoConcepts && results.aiVideoConcepts.length > 0 && (
        <AnalysisCard title="AI Video Concepts">
          <ul className="list-disc list-inside space-y-2">
            {results.aiVideoConcepts.map((concept, i) => <li key={i}>{concept}</li>)}
          </ul>
        </AnalysisCard>
      )}
    </div>
  );
};