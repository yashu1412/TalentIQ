import os
import time
from stream_chat import StreamChat
from dotenv import load_dotenv

load_dotenv()

class StreamService:
    def __init__(self):
        self.api_key = os.getenv("STREAM_API_KEY")
        self.api_secret = os.getenv("STREAM_API_SECRET")
        if self.api_key and self.api_secret:
            self.client = StreamChat(api_key=self.api_key, api_secret=self.api_secret)
        else:
            self.client = None

    def generate_token(self, user_id: str) -> str:
        if not self.client:
            return "mock_token"
        return self.client.create_token(user_id, expiration=int(time.time()) + 3600)

    def create_channel(self, channel_type: str, channel_id: str, created_by_id: str):
        if not self.client:
            return None
        channel = self.client.channel(channel_type, channel_id)
        channel.create(created_by_id)
        return channel
