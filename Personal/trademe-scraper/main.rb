require './page'
require 'nokogiri'
require 'byebug'
require 'open-uri'
require 'levenshtein'

class Main

  attr_accessor :categories, :keyword, :category, :html, :html_categories, :category_names, :category_url

  EMPTY_CATEGORIES = ["back to top", ""]
  CATEGORY_URL = "http://www.trademe.co.nz/browse"
  USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_0) AppleWebKit/535.2 (KHTML, like Gecko) Chrome/15.0.854.0 Safari/535.2"
  CSS_SELECTOR = "#fullCat"
  DEFAULT_SORT = "?sort_order=buynow_asc"

  def initialize(input)
    self.keyword = input
    self.categories = get_categories
    get_closest_match
    get_category_link
  end

  def get_categories
    self.html = Nokogiri(open(CATEGORY_URL, 'User-Agent' => USER_AGENT))
    self.html_categories = html.css(CSS_SELECTOR).css('a')
    self.category_names = html_categories.map(&:text).compact
    category_names.reject! { |category| EMPTY_CATEGORIES.include? category }
  end

  def get_closest_match
    closest = categories.collect do |html_category|
      distance = Levenshtein.distance(keyword, html_category)
      { name: html_category, distance: distance  }
    end
    self.category = closest.min_by{ |a| a[:distance] }
    puts "Searching within category #{category[:name]}"
  end

  def get_category_link
    mapping = html_categories.map { |link| { name: link.text.strip, url: link["href"] } }
    relative_link = mapping.find { |cat| cat[:name] == category[:name] }[:url]
    self.category_url =  "#{relative_link}#{DEFAULT_SORT}"
  end


end

main = Main.new(ARGV[0])
Page.new(main.category_url)