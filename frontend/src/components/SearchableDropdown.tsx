import React from 'react';
import { Dropdown, DropdownProps } from 'semantic-ui-react';

interface SearchableDropdownProps {
  options: Array<{ key: string; text: string; value: any }>;
  placeholder?: string;
  value?: any;
  onChange?: (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => void;
  className?: string;
  fluid?: boolean;
  search?: boolean;
  clearable?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  placeholder = "เลือก...",
  value,
  onChange,
  className = "",
  fluid = true,
  search = true,
  clearable = true,
  loading = false,
  disabled = false,
}) => {
  return (
    <Dropdown
      className={`searchable-dropdown ${className}`}
      placeholder={placeholder}
      fluid={fluid}
      search={search}
      selection
      clearable={clearable}
      loading={loading}
      disabled={disabled}
      options={options}
      value={value}
      onChange={onChange}
      searchInput={{ autoFocus: false }}
      noResultsMessage="ไม่พบข้อมูลที่ค้นหา"
    />
  );
};

export default SearchableDropdown;
