from langchain_openai import AzureChatOpenAI

from .settings import Settings


def build_llm(settings: Settings, temperature: float | None) -> AzureChatOpenAI:
    """The only place that knows how we authenticate to Azure OpenAI.

    To move to a service principal, replace `api_key` with
    `azure_ad_token_provider=...` here and drop AZURE_OPENAI_API_KEY.
    """
    settings.require_azure()
    kwargs = {} if temperature is None else {"temperature": temperature}
    return AzureChatOpenAI(
        azure_endpoint=settings.azure_openai_endpoint,
        api_key=settings.azure_openai_api_key,
        azure_deployment=settings.azure_openai_deployment,
        api_version=settings.azure_openai_api_version,
        **kwargs,
    )
