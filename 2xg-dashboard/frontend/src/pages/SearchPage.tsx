import ComingSoon from '../components/common/ComingSoon';

const SearchPage = () => {
  return (
    <ComingSoon
      moduleName="Global Search"
      description="Powerful search engine to find anything across all modules instantly."
      features={[
        'Cross-module global search',
        'Advanced filtering options',
        'Search history tracking',
        'Saved search queries',
        'Fuzzy search and autocomplete',
        'Search within specific modules',
        'Recently viewed items',
        'Quick access shortcuts',
        'Search result previews'
      ]}
    />
  );
};

export default SearchPage;
