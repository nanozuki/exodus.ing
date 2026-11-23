# src/routes/console

The signed-in viewer's settings console. The layout query requires login and
offers only the pages the viewer's roles allow; any other console path,
including `/console` itself, redirects to the first allowed page. Child pages
read the viewer from that same query, and their remotes still enforce
permissions themselves.
