import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class MovieMania {

    public static void main(String[] args) throws InterruptedException {

        WebDriver driver = new ChromeDriver();
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        driver.get("http://localhost:5173/login");
        driver.manage().window().maximize();
        Thread.sleep(2000);

        WebElement email = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.name("email"))
        );
        email.sendKeys("your_email_id");
        Thread.sleep(1500);

        WebElement password = driver.findElement(By.name("password"));
        password.sendKeys("your_password");
        Thread.sleep(1500);

        WebElement loginBtn = driver.findElement(
                By.xpath("//button[@type='submit']")
        );
        Thread.sleep(1000); 
        loginBtn.click();

        wait.until(ExpectedConditions.urlContains("/dashboard"));
        Thread.sleep(3000);

        driver.quit();
    }
}
