import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterProps {
  id: string;
  label: string;
  count?: number;
}

interface FilterButtonsProps {
  active: string;
  onFilterChange: (filter: string) => void;
  filters: FilterProps[];
}

const FilterButtons: React.FC<FilterButtonsProps> = ({ active, onFilterChange, filters }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const activeFilter = filters.find(filter => filter.id === active);
  
  // Desktop view - show all filter buttons
  const renderDesktopFilters = () => (
    <div className="hidden md:flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant="outline"
          size="sm"
          onClick={() => onFilterChange(filter.id)}
          className={`flex items-center ${
            active === filter.id 
              ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-500" 
              : "bg-gray-50 hover:bg-gray-100 text-black border border-gray-300"
          }`}
        >
          {filter.label}
          {filter.count !== undefined && (
            <Badge 
              variant="secondary" 
              className={`ml-2 ${
                active === filter.id 
                  ? "bg-blue-400 text-white" 
                  : "bg-gray-50 text-black border border-gray-300"
              }`}
            >
              {filter.count}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
  
  // Mobile view - show dropdown
  const renderMobileFilters = () => (
    <div className="md:hidden">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between bg-gray-50 hover:bg-gray-100 text-black border border-gray-300"
          >
            <span className="flex items-center">
              {activeFilter?.label || "All"}
              {activeFilter?.count !== undefined && (
                <Badge className="ml-2 bg-gray-200 text-black">
                  {activeFilter.count}
                </Badge>
              )}
            </span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          {filters.map((filter) => (
            <DropdownMenuItem 
              key={filter.id}
              onClick={() => {
                onFilterChange(filter.id);
                setIsOpen(false);
              }}
              className={`flex justify-between ${active === filter.id ? "bg-blue-50" : ""}`}
            >
              <span>{filter.label}</span>
              {filter.count !== undefined && (
                <Badge variant="secondary" className="ml-2 bg-gray-200 text-black">
                  {filter.count}
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
  
  return (
    <>
      {renderMobileFilters()}
      {renderDesktopFilters()}
    </>
  );
};

export default FilterButtons;
