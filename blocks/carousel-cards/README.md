# carousel-cards

Custom **carousel** block. Purpose: filterable-card-carousel.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: Row 1 (optional, 1 cell): filter label 'View Plans by...'. Card rows, 3 cells: [picture (+ optional link to MP4 = play in modal)] | [h3 title, p text or ul, link 'More Details'] | [categories, comma-separated]. Distinct categories become the filter options; a card without categories shows for every filter; 3 cards per slide, dots only, no autoplay.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Authoring model (exact)

| Carousel Cards | | |
| --- | --- | --- |
| View Plans by... | | |
| (picture) | ### Vehicle Service Agreements<br>Great for unexpected issues...<br>[More Details](/us/en/...) | New Vehicles, Toyota Certified Used Vehicles, Leased Vehicles |
| (picture)<br>[https://www.toyotafinancial.com/.../VSA.mp4](https://www.toyotafinancial.com/.../VSA.mp4) | ... | ... |
| (picture) | TFS offers 4 protection products in this category: + list | Leased Vehicles |

- Filter row (optional): a single cell with the filter label.
- Card rows: `image | body | categories`.
  - Image cell: a picture; add a link to an MP4/WebM file (absolute URL on toyotafinancial.com) to
    turn the image into a play button that opens the video in a modal (controls, plays after the click).
  - Body cell: heading, text or list, and a "More Details" link.
  - Categories cell (optional): comma-separated filter values. Distinct values, in authored order,
    become the filter options (first one selected). A card with no categories (or no third cell)
    shows under every filter. If no card has categories, no filter is rendered.
- Up to 3 cards per slide (stacked on mobile, 3 columns from 900px). Dot buttons only, no arrows,
  no autoplay. Changing the filter rebuilds the slides and returns to slide 1.
