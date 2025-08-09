import { CountryTooltipData, RelationshipTooltipData } from '@/types/tooltip';

interface CountryTooltipProps {
  data: CountryTooltipData;
}

interface RelationshipTooltipProps {
  data: RelationshipTooltipData;
}

export const CountryTooltip: React.FC<CountryTooltipProps> = ({ data }) => {
  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-sm border border-gray-600">
      <div className="mb-2">
        <h3 className="text-lg font-bold text-blue-400">{data.country}</h3>
        {data.lastUpdated && (
          <p className="text-xs text-gray-400">
            Updated: {new Date(data.lastUpdated).toLocaleDateString()}
          </p>
        )}
      </div>
      <div className="mb-3">
        <p className="text-sm leading-relaxed">{data.paragraph}</p>
      </div>
      {data.sources && data.sources.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-1">Sources:</p>
          <div className="flex flex-wrap gap-1">
            {data.sources.map((source, index) => (
              <span
                key={index}
                className="text-xs bg-gray-700 px-2 py-1 rounded"
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const RelationshipTooltip: React.FC<RelationshipTooltipProps> = ({ data }) => {
  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md border border-gray-600">
      <div className="mb-2">
        <h3 className="text-lg font-bold text-purple-400">
          {data.country1} ↔ {data.country2}
        </h3>
        <p className="text-sm text-yellow-400 capitalize font-medium">
          Relationship: {data.relationship}
        </p>
        {data.lastUpdated && (
          <p className="text-xs text-gray-400">
            Updated: {new Date(data.lastUpdated).toLocaleDateString()}
          </p>
        )}
      </div>
      <div className="mb-3">
        <p className="text-sm leading-relaxed">{data.paragraph}</p>
      </div>
      {data.sources && data.sources.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-1">Sources:</p>
          <div className="flex flex-wrap gap-1">
            {data.sources.map((source, index) => (
              <span
                key={index}
                className="text-xs bg-gray-700 px-2 py-1 rounded"
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Default fallback tooltips for when data isn't available
export const DefaultCountryTooltip: React.FC<{ country: string }> = ({ country }) => {
  return (
    <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg max-w-xs border border-gray-600">
      <h3 className="text-md font-bold text-blue-400 mb-2">{country}</h3>
      <p className="text-sm text-gray-300">
        Click to analyze current developments and relationships with other countries.
      </p>
    </div>
  );
};

export const LoadingTooltip: React.FC = () => {
  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-xs border border-gray-600">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-full mb-1"></div>
        <div className="h-3 bg-gray-700 rounded w-5/6"></div>
      </div>
      <p className="text-xs text-gray-400 mt-2">Loading current events...</p>
    </div>
  );
};