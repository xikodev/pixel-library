UPDATE `PERSON`
SET `character` = '0'
WHERE `character` IS NULL
   OR `character` NOT REGEXP '^[0-9]+$'
   OR CAST(`character` AS UNSIGNED) > 10;

ALTER TABLE `PERSON`
MODIFY `character` INT NOT NULL DEFAULT 0;
