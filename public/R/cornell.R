library(dplyr)

data1 <- read.csv('Forage_quality_NY_MD_2015.csv')
data2 <- read.csv('Cornell_University_2025-02-17.csv')
data3 <- inner_join(data1, data2, by = c('CP', 'ADF', 'aNDF', 'NDFD48'))
missing <- anti_join(data1, data2, by = c('CP', 'ADF', 'aNDF', 'NDFD48'))

write.csv(data3, "NYMD.csv")
