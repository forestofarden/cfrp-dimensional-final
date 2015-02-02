MDAT:  consists of 3 separate parts

  - etl.			get data from various sources and transform it as desired
  - crossfilter.	bitmap index data to provide fast filter operations
  - signals.        connect D3 mark properties to result vectors, brush via signals


- data frame: 
  (1) a set of named vectors of identical length
  (2) an optional grouping

- operations.  ALL yield a dataframe

    a[col1, col2, ....]				-- subset: new data frame with only the given columns
                                       alternately, select columns that match/don't match a query

    a + b 							-- add: new data frame with all columns (a b equal length, disjoint columns)

    a[col] = b						-- set column: add or replace a column (b must be vector of right length)

    a[colexp1, colexp2, ...]		-- filter: new data frame with only matching rows

    arrange(a, colexpr asc/desc)    -- re-order rows (possibly within groups)

    group(a, colexpr)               -- group rows by expression.  if already grouped, produce subgroups

    ungroup(a)                      -- remove all grouping

    gather(a, var_col, val_col,     -- pivot: make wide data long 
           cola..colb)

    spread(a, cat_col, val_col)     -- pivot: make long data wide

    distinct(a)                     -- remove any duplicate rows

    summarise(a, col_0=fn_0...)     -- replace each group g, reducing col{n} with fn{n}

    top(a, n)                       -- filter to only the top or bottom n rows (after arranging)
    bottom(a, n)

    local(a)                        -- make sure dataset is available locally from this point




  Timeline: 
    color: author
    mark: line
    mark.x: 


- can the mdat automatically determine when data must be local?  
  * when a signal is provided as an argument to filter?
  * on first re-evaluation of a filter argument (laggy)?

