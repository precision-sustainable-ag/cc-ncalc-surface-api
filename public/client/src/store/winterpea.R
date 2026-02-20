library(openxlsx)
library(dplyr)

setwd("C:/psa/cc-ncalc-api/public/client/src/store")

csv <- read.csv("20NC2_WP_ALT-Kinston_data.csv", check.names = FALSE) |>
  rename(Stage1 = `Growth Stage Score - Harvest 1`) |>
  rename(Stage2 = `Growth Stage Harvest 2`)

xls <- read.xlsx("ForageQualityAnalysis Samples from NCxlsx.xlsx") |>
  rename(Sample = `Sample.Description.(unique.ID)`) |>
  filter(startsWith(Sample, "20NCWP"))

data <- merge(csv, xls, by = c("Rep", "Range", "Row"))

all <- read.csv("all.csv", check.names = FALSE) |>
  left_join(data |> select(Sample, Stage1, Stage2), by = "Sample") |>
  mutate(
    `Growth Stage` = case_when(
      endsWith(Sample, "Harvest1") & !is.na(Stage1) ~
        if_else(Stage1 < 5, "Vegetative", "Flowering"),
      endsWith(Sample, "Harvest2") & !is.na(Stage1) ~
        if_else(Stage2 < 5, "Vegetative", "Flowering"),
      TRUE ~ `Growth Stage`
    )
  ) |>
  select(-Stage1, -Stage2)

write.csv(all, "all.csv", row.names = FALSE, quote = FALSE, na = "")
