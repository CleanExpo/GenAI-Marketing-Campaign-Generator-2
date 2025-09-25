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
  defaultAspectRatio: string;
  defaultNegativePrompt: string;
}

interface ImageResultProps {
    initialPrompt: string;
    defaultAspectRatio: string;
    defaultNegativePrompt: string;
}

const ImageResult: React.FC<ImageResultProps> = ({ initialPrompt, defaultAspectRatio, defaultNegativePrompt }) => {
    const [editablePrompt, setEditablePrompt] = useState(initialPrompt);
    const [aspectRatio, setAspectRatio] = useState(defaultAspectRatio);
    const [negativePrompt, setNegativePrompt] = useState(defaultNegativePrompt);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const url = await generateImageFromPrompt(editablePrompt, aspectRatio, negativePrompt);
            setImageUrl(url);
        } catch (err) {
            setError('Failed to generate image. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-4 bg-slate-700/50 rounded-lg space-y-3">
             <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Prompt</label>
                <textarea
                    value={editablePrompt}
                    onChange={(e) => setEditablePrompt(e.target.value)}
                    className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-sm"
                    rows={3}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Aspect Ratio</label>
                    <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-sm"
                    >
                        <option value="1:1">Square (1:1)</option>
                        <option value="16:9">Widescreen (16:9)</option>
                        <option value="9:16">Story (9:16)</option>
                        <option value="4:3">Landscape (4:3)</option>
                        <option value="3:4">Portrait (3:4)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Negative Prompt</label>
                    <input
                        type="text"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="e.g., text, blurry, watermark"
                        className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-sm"
                    />
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-sm text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 flex items-center justify-center"
                    style={{ minWidth: '120px' }}
                >
                    {isGenerating ? (
                        <>
                            <LoadingSpinner />
                            <span className="ml-2">Generating...</span>
                        </>
                    ) : (
                        imageUrl ? 'Regenerate' : 'Generate Image'
                    )}
                </button>
                {imageUrl && (
                    <a
                        href={imageUrl}
                        download={`campaign-image-${Date.now()}.jpg`}
                        className="bg-slate-600 hover:bg-slate-500 text-sm text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center"
                    >
                        Download
                    </a>
                )}
            </div>
            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
            {imageUrl && <img src={imageUrl} alt={editablePrompt} className="mt-3 rounded-lg shadow-md w-full" />}
        </div>
    );
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, isLoading, error, companyName, defaultAspectRatio, defaultNegativePrompt }) => {
  if (isLoading) {
    return (
      <div className="text-center p-10 bg-slate-800/50 rounded-lg mt-8 border border-slate-700">
        <div className="flex justify-center items-center mb-4">
          <LoadingSpinner />
        </div>
        {/* FIX: Replaced non-standard 'animate-pulse-fast' with 'animate-pulse' */}
        <p className="text-xl text-cyan-400 animate-pulse">Generating Your Campaign...</p>
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
        <AnalysisCard title="Social Media Content Examples">
          <div className="space-y-4">
            {results.socialMediaContent.map((item, i) => (
              <div key={i}>
                <h4 className="font-bold text-slate-100 flex items-center">
                  <a href={generateSocialUrl(item.platform, companyName)} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center">
                    {item.platform}
                    <ExternalLinkIcon className="h-4 w-4 ml-1.5 text-slate-400"/>
                  </a>
                </h4>
                <p className="text-sm whitespace-pre-wrap font-mono bg-slate-900/50 p-3 rounded-md mt-1">{item.contentExample}</p>
              </div>
            ))}
          </div>
        </AnalysisCard>

        <AnalysisCard title="SEO Keywords">
          <div className="flex flex-wrap gap-2">
            {results.seoKeywords.map((kw, i) => <span key={i} className="bg-slate-700 text-cyan-300 text-sm font-medium px-2.5 py-1 rounded-full">{kw}</span>)}
          </div>
        {/* FIX: Corrected closing tag for AnalysisCard */}
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

      {results.competitorAnalysis && results.competitorAnalysis.length > 0 && (
        <AnalysisCard title="Competitor Analysis">
          <div className="space-y-6">
            {results.competitorAnalysis.map((comp, i) => (
              <div key={i} className="p-4 bg-slate-700/50 rounded-md">
                <h4 className="font-bold text-slate-100 break-all">{comp.competitor}</h4>
                <div className="mt-3 space-y-3">
                  <div>
                    <strong className="font-semibold text-slate-200">Strengths:</strong>
                    <ul className="list-disc list-inside space-y-1 mt-1 text-sm">
                      {comp.strengths.map((s, j) => <li key={j}>{s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <strong className="font-semibold text-slate-200">Weaknesses:</strong>
                    <ul className="list-disc list-inside space-y-1 mt-1 text-sm">
                      {comp.weaknesses.map((w, j) => <li key={j}>{w}</li>)}
                    </ul>
                  </div>
                  <div>
                    <strong className="font-semibold text-slate-200">Strategy Summary:</strong>
                    <p className="mt-1 text-sm">{comp.strategy}</p>
                  </div>
                  {comp.strategyExamples && comp.strategyExamples.length > 0 && (
                    <div>
                        <strong className="font-semibold text-slate-200">Marketing Strategy Examples:</strong>
                        <ul className="list-disc list-inside space-y-1 mt-1 text-sm">
                            {comp.strategyExamples.map((ex, j) => <li key={j}>{ex}</li>)}
                        </ul>
                    </div>
                  )}
                </div>
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
            {results.aiImagePrompts.map((prompt, i) => (
                <ImageResult 
                    key={i} 
                    initialPrompt={prompt} 
                    defaultAspectRatio={defaultAspectRatio}
                    defaultNegativePrompt={defaultNegativePrompt}
                />
            ))}
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