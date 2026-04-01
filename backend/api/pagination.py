from rest_framework.pagination import PageNumberPagination


class FeedPagination(PageNumberPagination):
    """
    Pagination for the personalized recipe feed endpoint.
    Clients may override page_size up to max_page_size via ?page_size=N.
    """

    page_size: int = 20
    page_size_query_param: str = "page_size"
    max_page_size: int = 50
