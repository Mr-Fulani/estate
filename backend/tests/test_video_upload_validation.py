import unittest

from app.media_storage import detect_video_extension


class VideoUploadValidationTests(unittest.TestCase):
    def test_mp4_and_mov_are_detected_from_file_signature(self):
        header = b"\x00\x00\x00\x18ftypisom"
        self.assertEqual(detect_video_extension(header, "sample.mp4"), ".mp4")
        self.assertEqual(detect_video_extension(header, "sample.MOV"), ".mov")

    def test_webm_and_ogg_are_detected(self):
        self.assertEqual(detect_video_extension(b"\x1a\x45\xdf\xa3rest"), ".webm")
        self.assertEqual(detect_video_extension(b"OggSrest"), ".ogv")

    def test_unrecognized_content_is_rejected(self):
        self.assertIsNone(detect_video_extension(b"not a video", "sample.mp4"))


if __name__ == "__main__":
    unittest.main()
