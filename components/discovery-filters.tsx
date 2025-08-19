"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, Calendar, Users, BookOpen } from "lucide-react"

interface DiscoveryFiltersProps {
  searchParams: {
    location?: string
    start_date?: string
    end_date?: string
    min_age?: string
    max_age?: string
    interests?: string
    homeschool_style?: string
  }
}

export default function DiscoveryFilters({ searchParams }: DiscoveryFiltersProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(Object.keys(searchParams).length > 1)

  const [filters, setFilters] = useState({
    location: searchParams.location || "",
    start_date: searchParams.start_date || "",
    end_date: searchParams.end_date || "",
    min_age: searchParams.min_age || "",
    max_age: searchParams.max_age || "",
    interests: searchParams.interests || "",
    homeschool_style: searchParams.homeschool_style || "any",
  })

  const handleSearch = () => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) {
        params.set(key, value.trim())
      }
    })

    router.push(`/discover?${params.toString()}`)
  }

  const handleReset = () => {
    setFilters({
      location: "",
      start_date: "",
      end_date: "",
      min_age: "",
      max_age: "",
      interests: "",
      homeschool_style: "any",
    })
    router.push("/discover")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search & Filter
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            <Filter className="h-4 w-4 mr-2" />
            {isExpanded ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Search */}
        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              placeholder="Search by destination (e.g., Barcelona, Spain)"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="w-full"
            />
          </div>
          <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Travel Dates
              </label>
              <Input
                type="date"
                placeholder="Start date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
              <Input
                type="date"
                placeholder="End date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              />
            </div>

            {/* Kids Ages */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Kids Ages
              </label>
              <Input
                type="number"
                placeholder="Min age"
                value={filters.min_age}
                onChange={(e) => setFilters({ ...filters, min_age: e.target.value })}
                min="0"
                max="18"
              />
              <Input
                type="number"
                placeholder="Max age"
                value={filters.max_age}
                onChange={(e) => setFilters({ ...filters, max_age: e.target.value })}
                min="0"
                max="18"
              />
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Interests</label>
              <Input
                placeholder="e.g., museums, hiking, art"
                value={filters.interests}
                onChange={(e) => setFilters({ ...filters, interests: e.target.value })}
              />
              <p className="text-xs text-gray-500">Separate multiple interests with commas</p>
            </div>

            {/* Homeschool Style */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                Homeschool Style
              </label>
              <Select
                value={filters.homeschool_style}
                onValueChange={(value) => setFilters({ ...filters, homeschool_style: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any style</SelectItem>
                  <SelectItem value="traditional">Traditional/Structured</SelectItem>
                  <SelectItem value="charlotte-mason">Charlotte Mason</SelectItem>
                  <SelectItem value="montessori">Montessori</SelectItem>
                  <SelectItem value="waldorf">Waldorf/Steiner</SelectItem>
                  <SelectItem value="unschooling">Unschooling</SelectItem>
                  <SelectItem value="unit-studies">Unit Studies</SelectItem>
                  <SelectItem value="eclectic">Eclectic</SelectItem>
                  <SelectItem value="online">Online/Virtual</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isExpanded && (
          <div className="flex space-x-2 pt-4 border-t">
            <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700">
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
