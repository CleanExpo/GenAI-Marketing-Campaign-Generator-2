import React from 'react';
import SecureInput from './SecureInput';

interface ProductDescriptionFormProps {
  productDescription: string;
  onProductDescriptionChange: (value: string) => void;
  generateMedia: boolean;
  onGenerateMediaChange: (value: boolean) => void;
  onInspirationClick: () => void;
  onValidationChange: (field: string, isValid: boolean, errors: string[]) => void;
  onUserInteraction: (action: string) => void;
}

/**
 * Component for product description input and media generation settings
 */
export const ProductDescriptionForm: React.FC<ProductDescriptionFormProps> = ({
  productDescription,
  onProductDescriptionChange,
  generateMedia,
  onGenerateMediaChange,
  onInspirationClick,
  onValidationChange,
  onUserInteraction
}) => {
  return (
    <div className="bg-slate-800/50 rounded-lg p-6 shadow-lg border border-slate-700">
      <div className="space-y-6">
        {/* Product Description Input */}
        <div>
          <label htmlFor="productDescription" className="block text-lg font-medium text-slate-300 mb-2">
            Describe your product, service, or idea
          </label>
          <SecureInput
            value={productDescription}
            onChange={onProductDescriptionChange}
            type="textarea"
            placeholder="e.g., A subscription box for artisanal coffee from around the world."
            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-base"
            maxLength={5000}
            required={true}
            onValidationChange={(isValid, errors) => onValidationChange('productDescription', isValid, errors)}
            sanitizeOnBlur={true}
          />
          <button
            onClick={() => {
              onInspirationClick();
              onUserInteraction('inspiration-clicked');
            }}
            className="text-sm text-cyan-400 hover:text-cyan-300 mt-2 transition-colors"
            type="button"
          >
            ✨ Get Inspired
          </button>
        </div>

        {/* Generate Media Toggle */}
        <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-md">
          <label htmlFor="generateMedia" className="font-medium text-slate-200 flex-1 cursor-pointer">
            Generate Media Assets (Image Prompts & Video Concepts)
          </label>
          <input
            type="checkbox"
            name="generateMedia"
            id="generateMedia"
            checked={generateMedia}
            onChange={(e) => {
              onGenerateMediaChange(e.target.checked);
              onUserInteraction(e.target.checked ? 'media-enabled' : 'media-disabled');
            }}
            className="h-5 w-5 rounded bg-slate-900 border-slate-500 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDescriptionForm;