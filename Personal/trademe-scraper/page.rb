require 'nokogiri'
require 'byebug'
require 'open-uri'


class Page

  attr_accessor :category_url, :category_pages, :links

  USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_0) AppleWebKit/535.2 (KHTML, like Gecko) Chrome/15.0.854.0 Safari/535.2"
  BASE_URL = "http://www.trademe.co.nz"



	def initialize(url)
    self.category_url = url
    self.category_pages = []
    self.category_pages << url
    self.links = []
    get_pages(url)
    get_page_category_pages
  end

  def get_page_category_pages
    category_pages.each_with_index do |page,index|
      debugger
      html = Nokogiri(open(page, 'User-Agent' => USER_AGENT))
      if html.css(".ListViewList").nil? 
        list_view_list(html, index+1)
      else
        supergrid_overlord(html, index+1)
      end
    end
    links.reject! { |link| !link.include? "/" }
  end

  def get_pages(url)
    html = Nokogiri(open("#{BASE_URL}#{url}", 'User-Agent' => USER_AGENT))
    while !html.css('[@rel="next"]').empty?
      link = category_pages.last.prepend(BASE_URL)
      html = Nokogiri(open(link, 'User-Agent' => USER_AGENT))
      category_pages << html.css('[@rel="next"]').first.values[0] unless html.css('[@rel="next"]').first.nil?
      print "\rProcessing page #{category_pages.count}"
    end
    puts "\nDone getting index pages"
  end

  def list_view_list(html_node, index)
    debugger
  end

  def supergrid_overlord(html_node, index)
    listings = html_node.css('.supergrid-listing')
    print "\rProcessing links on page ##{index}"
    listings.each do |listing|
      links << listing.parent.first[1] unless listing.parent.nil?
    end
  end

end
