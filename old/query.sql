DROP VIEW warehouse CASCADE;

CREATE VIEW warehouse AS
SELECT sales.date,
  sales.weekday,
  sales.sold,
  sales.raw_section,
  sales.price,
  sales.section,
  playbill."order",
  playbill.author,
  playbill.title,
  playbill.genre,
  playbill.acts,
  image_file_name
FROM sales
  JOIN playbill USING (register_id)
  LEFT OUTER JOIN register_images USING (register_id)
WHERE price IS NOT NULL
  AND sold IS NOT NULL
  AND author IS NOT NULL
  AND register_images.orientation = 'recto';


DROP VIEW author_yearly_receipts CASCADE;
CREATE VIEW author_yearly_receipts AS

  SELECT EXTRACT(year FROM date)::INT AS year,
         lower(split_part(author, ' ', 1))::TEXT as author,
         sum(sold * price)::INT AS parterre_sales
  FROM warehouse
  WHERE author IN ('Voltaire (François-Marie Arouet dit)',
                   'Molière (Jean-Baptiste Poquelin dit)',
                   'Corneille (Pierre)',
                   'Racine (Jean)')
    AND section = 'parterre'
  GROUP BY author, year
  ORDER BY author, year;


DROP VIEW author_yearly_receipts_pivot CASCADE;
CREATE VIEW author_yearly_receipts_pivot AS

  SELECT * FROM crosstab('SELECT year, author, parterre_sales FROM author_yearly_receipts ORDER BY 1,2', 
                         'SELECT unnest(ARRAY[''corneille'', ''molière'', ''racine'', ''voltaire''])')
    AS ("year" INT, "corneille" INT, "molière" INT, "racine" INT, "voltaire" INT);


DROP VIEW yearly_receipts CASCADE;
CREATE VIEW yearly_receipts AS

  SELECT EXTRACT(year FROM date)::INT AS year,
         sum(sold * price)::INT AS parterre_sales
  FROM warehouse
  WHERE section = 'parterre'
  GROUP BY year
  ORDER BY year;


COPY (
  SELECT author_yearly_receipts_pivot.*, 
         parterre_sales as Total 
  FROM author_yearly_receipts_pivot NATURAL JOIN yearly_receipts
) TO '/tmp/yearly_parterre_receipts_by_author.tsv' WITH CSV HEADER DELIMITER E'\t';

COPY (
  SELECT * FROM warehouse
) TO '/tmp/warehouse.tsv' WITH CSV HEADER DELIMITER E'\t';

COPY (
  SELECT date, "order", author, genre, section, price, sold FROM warehouse
) TO '/tmp/warehouse_opt.tsv' WITH CSV HEADER DELIMITER E'\t';

