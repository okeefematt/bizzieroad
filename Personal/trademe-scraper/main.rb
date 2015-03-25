require 'nokogiri'
require 'byebug'
require 'open-uri'
require 'levenshtein'

class Main

  attr_accessor :categories, :keyword, :category

  EMPTY_CATEGORIES = ["back to top", ""]
  CATEGORY_URL = "http://www.trademe.co.nz/browse"
  USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_0) AppleWebKit/535.2 (KHTML, like Gecko) Chrome/15.0.854.0 Safari/535.2"
  CSS_SELECTOR = "#fullCat"

  def get_category(input, css_selector="")
    options = CSS_SELECTOR if css_selector.empty?
    self.keyword = input
    self.categories = get_categories(options)
    get_closest_match
  end

  def get_categories(options)
    html = Nokogiri(open(CATEGORY_URL, 'User-Agent' => USER_AGENT))
    html_categories = html.css("#{options}").css('a').map(&:text).compact
    html_categories.reject! { |category| EMPTY_CATEGORIES.include? category }
  end

  def get_closest_match
    closest = categories.collect do |html_category|
      distance = Levenshtein.distance(keyword, html_category)
      { name: html_category, distance: distance  }
    end
    self.category = closest.min_by{ |a| a[:distance] }
    puts "Searching within category #{category[:name]}"
  end



end

main = Main.new
main.get_category("Laptop")